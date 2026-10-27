'use strict';
/**
 * Single data layer for all database queries.
 * Parameterized statements prevent SQL injection and allow easy portability.
 */
const { db } = require('./index');
const crypto = require('crypto');

// ==========================================
// 1. SETTINGS
// ==========================================
const Settings = {
  get(key, defaultValue = '') {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
  },

  getAll() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const map = {};
    for (const r of rows) map[r.key] = r.value;
    return map;
  },

  set(key, value) {
    const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value != null ? value : '');
    db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(key, strVal);
  },

  setMultiple(obj) {
    const insert = db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);
    const transaction = db.transaction((data) => {
      for (const [k, v] of Object.entries(data)) {
        const strVal = typeof v === 'object' ? JSON.stringify(v) : String(v != null ? v : '');
        insert.run(k, strVal);
      }
    });
    transaction(obj);
  }
};

// ==========================================
// 2. USERS & AUTHENTICATION
// ==========================================
const Users = {
  count() {
    return db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  },

  list() {
    return db.prepare('SELECT id, email, name, role, active, two_factor_enabled, last_login_at, created_at FROM users ORDER BY created_at DESC').all();
  },

  create({ email, password_hash, name, role = 'Editor' }) {
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    const info = stmt.run(email.toLowerCase().trim(), password_hash, name.trim(), role);
    return info.lastInsertRowid;
  },

  update(id, fields) {
    const allowed = ['name', 'email', 'role', 'active', 'two_factor_secret', 'two_factor_enabled', 'password_hash'];
    const sets = [];
    const vals = [];
    for (const k of allowed) {
      if (fields[k] !== undefined) {
        sets.push(`${k} = ?`);
        vals.push(fields[k]);
      }
    }
    if (!sets.length) return;
    sets.push('updated_at = CURRENT_TIMESTAMP');
    vals.push(id);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  },

  recordLogin(id, ip) {
    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, last_login_ip = ? WHERE id = ?').run(ip, id);
  },

  delete(id) {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  // Failed login tracking for lockout
  recordLoginAttempt(email, ip, success) {
    db.prepare('INSERT INTO login_attempts (email, ip, success) VALUES (?, ?, ?)').run(email, ip, success ? 1 : 0);
  },

  isLockedOut(email, ip) {
    // Check if more than 5 failed attempts in the last 15 minutes
    const row = db.prepare(`
      SELECT COUNT(*) as failed
      FROM login_attempts 
      WHERE (LOWER(email) = LOWER(?) OR ip = ?)
        AND success = 0 
        AND attempted_at >= datetime('now', '-15 minutes')
    `).get(email, ip);
    return row.failed >= 5;
  }
};

// ==========================================
// 3. PAGES & SECTIONS
// ==========================================
const Pages = {
  getAll() {
    return db.prepare('SELECT * FROM pages ORDER BY id ASC').all();
  },

  getBySlug(slug) {
    return db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug);
  },

  save(slug, data) {
    const existing = db.prepare('SELECT id FROM pages WHERE slug = ?').get(slug);
    if (existing) {
      db.prepare(`
        UPDATE pages SET 
          title = ?, meta_title = ?, meta_description = ?, canonical_url = ?, 
          focus_keyword = ?, og_image = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE slug = ?
      `).run(
        data.title, data.meta_title || '', data.meta_description || '', 
        data.canonical_url || '', data.focus_keyword || '', data.og_image || '',
        data.status || 'published', slug
      );
      return existing.id;
    } else {
      const info = db.prepare(`
        INSERT INTO pages (slug, title, meta_title, meta_description, canonical_url, focus_keyword, og_image, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        slug, data.title, data.meta_title || '', data.meta_description || '', 
        data.canonical_url || '', data.focus_keyword || '', data.og_image || '', data.status || 'published'
      );
      return info.lastInsertRowid;
    }
  },

  getSections(pageSlug) {
    const page = db.prepare('SELECT id FROM pages WHERE slug = ?').get(pageSlug);
    if (!page) return {};
    const rows = db.prepare('SELECT section_key, title, subtitle, body, button_text, button_url, image_url, extra_json FROM page_sections WHERE page_id = ?').all(page.id);
    const sections = {};
    for (const r of rows) {
      sections[r.section_key] = {
        title: r.title || '',
        subtitle: r.subtitle || '',
        body: r.body || '',
        button_text: r.button_text || '',
        button_url: r.button_url || '',
        image_url: r.image_url || '',
        extra: r.extra_json ? JSON.parse(r.extra_json) : {}
      };
    }
    return sections;
  },

  saveSection(pageSlug, sectionKey, data) {
    const page = db.prepare('SELECT id FROM pages WHERE slug = ?').get(pageSlug);
    if (!page) return;
    const extraJson = data.extra ? JSON.stringify(data.extra) : null;
    db.prepare(`
      INSERT INTO page_sections (page_id, section_key, title, subtitle, body, button_text, button_url, image_url, extra_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(page_id, section_key) DO UPDATE SET
        title = excluded.title, subtitle = excluded.subtitle, body = excluded.body,
        button_text = excluded.button_text, button_url = excluded.button_url,
        image_url = excluded.image_url, extra_json = excluded.extra_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      page.id, sectionKey, data.title || '', data.subtitle || '', data.body || '',
      data.button_text || '', data.button_url || '', data.image_url || '', extraJson
    );
  },

  deleteSection(pageSlug, sectionKey) {
    const page = db.prepare('SELECT id FROM pages WHERE slug = ?').get(pageSlug);
    if (!page) return;
    db.prepare('DELETE FROM page_sections WHERE page_id = ? AND section_key = ?').run(page.id, sectionKey);
  },

  // Versioning
  createVersion(entityType, entityId, title, snapshot, userId = null) {
    db.prepare(`
      INSERT INTO content_versions (entity_type, entity_id, title, snapshot_json, created_by_user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(entityType, String(entityId), title, JSON.stringify(snapshot), userId);
  },

  getVersions(entityType, entityId) {
    return db.prepare(`
      SELECT v.*, u.name as author_name 
      FROM content_versions v
      LEFT JOIN users u ON v.created_by_user_id = u.id
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY v.created_at DESC LIMIT 20
    `).all(entityType, String(entityId));
  },

  getVersionById(id) {
    return db.prepare('SELECT * FROM content_versions WHERE id = ?').get(id);
  }
};

// ==========================================
// 4. SERVICES
// ==========================================
const Services = {
  getAll() {
    return db.prepare('SELECT * FROM services ORDER BY sort_order ASC, id ASC').all();
  },

  getVisible() {
    return db.prepare('SELECT * FROM services WHERE visible = 1 ORDER BY sort_order ASC, id ASC').all();
  },

  getBySlug(slug) {
    return db.prepare('SELECT * FROM services WHERE slug = ?').get(slug);
  },

  create(data) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM services').get().m || 0;
    const stmt = db.prepare(`
      INSERT INTO services (slug, title, short_desc, teaser, full_desc, included, best_for, delivery_note, cta_text, icon, image, sort_order, visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.slug, data.title, data.short_desc || '', data.teaser || '', data.full_desc || '',
      data.included || '', data.best_for || '', data.delivery_note || '', data.cta_text || 'Enquire about service',
      data.icon || 'globe', data.image || '', maxSort + 1, data.visible !== undefined ? (data.visible ? 1 : 0) : 1
    );
    return info.lastInsertRowid;
  },

  update(id, data) {
    db.prepare(`
      UPDATE services SET
        slug = ?, title = ?, short_desc = ?, teaser = ?, full_desc = ?, included = ?,
        best_for = ?, delivery_note = ?, cta_text = ?, icon = ?, image = ?, visible = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.slug, data.title, data.short_desc || '', data.teaser || '', data.full_desc || '',
      data.included || '', data.best_for || '', data.delivery_note || '', data.cta_text || 'Enquire about service',
      data.icon || 'globe', data.image || '', data.visible ? 1 : 0, id
    );
  },

  delete(id) {
    db.prepare('DELETE FROM services WHERE id = ?').run(id);
  },

  reorder(idList) {
    const update = db.prepare('UPDATE services SET sort_order = ? WHERE id = ?');
    const transaction = db.transaction((ids) => {
      ids.forEach((id, idx) => update.run(idx + 1, id));
    });
    transaction(idList);
  }
};

// ==========================================
// 5. BRANDS THAT TRUST US
// ==========================================
const Brands = {
  getAll() {
    return db.prepare('SELECT * FROM brands ORDER BY sort_order ASC, id ASC').all();
  },

  getVisible() {
    return db.prepare('SELECT * FROM brands WHERE visible = 1 ORDER BY sort_order ASC, id ASC').all();
  },

  create(data) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM brands').get().m || 0;
    const stmt = db.prepare('INSERT INTO brands (name, logo, url, sort_order, visible) VALUES (?, ?, ?, ?, ?)');
    const isVisible = data.visible !== undefined ? (data.visible ? 1 : 0) : 1;
    const info = stmt.run(data.name, data.logo, data.url || '', maxSort + 1, isVisible);
    return info.lastInsertRowid;
  },

  update(id, data) {
    db.prepare(`
      UPDATE brands SET name = ?, logo = ?, url = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.name, data.logo, data.url || '', data.visible ? 1 : 0, id);
  },

  delete(id) {
    db.prepare('DELETE FROM brands WHERE id = ?').run(id);
  },

  reorder(idList) {
    const update = db.prepare('UPDATE brands SET sort_order = ? WHERE id = ?');
    const transaction = db.transaction((ids) => {
      ids.forEach((id, idx) => update.run(idx + 1, id));
    });
    transaction(idList);
  }
};

// ==========================================
// 6. FAQS
// ==========================================
const FAQs = {
  getAll() {
    return db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC').all();
  },

  getVisible() {
    return db.prepare('SELECT * FROM faqs WHERE visible = 1 ORDER BY sort_order ASC, id ASC').all();
  },

  create(data) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM faqs').get().m || 0;
    const stmt = db.prepare('INSERT INTO faqs (question, answer, sort_order, visible) VALUES (?, ?, ?, ?)');
    const info = stmt.run(data.question, data.answer, maxSort + 1, data.visible !== undefined ? (data.visible ? 1 : 0) : 1);
    return info.lastInsertRowid;
  },

  update(id, data) {
    db.prepare('UPDATE faqs SET question = ?, answer = ?, visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(data.question, data.answer, data.visible ? 1 : 0, id);
  },

  delete(id) {
    db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
  },

  reorder(idList) {
    const update = db.prepare('UPDATE faqs SET sort_order = ? WHERE id = ?');
    const transaction = db.transaction((ids) => {
      ids.forEach((id, idx) => update.run(idx + 1, id));
    });
    transaction(idList);
  }
};

// ==========================================
// 7. PRICING PLANS & ROWS
// ==========================================
const Plans = {
  getAll() {
    return db.prepare('SELECT * FROM plans ORDER BY sort_order ASC, id ASC').all();
  },

  getVisible() {
    return db.prepare('SELECT * FROM plans WHERE visible = 1 ORDER BY sort_order ASC, id ASC').all();
  },

  create(data) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM plans').get().m || 0;
    const stmt = db.prepare(`
      INSERT INTO plans (name, description, delivery, features, highlighted, badge, button_text, button_link, sort_order, visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const isVisible = data.visible !== undefined ? (data.visible ? 1 : 0) : 1;
    const info = stmt.run(
      data.name, data.description || '', data.delivery || '', data.features || '',
      data.highlighted ? 1 : 0, data.badge || '', data.button_text || 'Get a quote',
      data.button_link || 'contact.html', maxSort + 1, isVisible
    );
    return info.lastInsertRowid;
  },

  update(id, data) {
    db.prepare(`
      UPDATE plans SET
        name = ?, description = ?, delivery = ?, features = ?, highlighted = ?,
        badge = ?, button_text = ?, button_link = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name, data.description || '', data.delivery || '', data.features || '',
      data.highlighted ? 1 : 0, data.badge || '', data.button_text || 'Get a quote',
      data.button_link || 'contact.html', data.visible ? 1 : 0, id
    );
  },

  delete(id) {
    db.prepare('DELETE FROM plans WHERE id = ?').run(id);
  },

  reorder(idList) {
    const update = db.prepare('UPDATE plans SET sort_order = ? WHERE id = ?');
    const transaction = db.transaction((ids) => {
      ids.forEach((id, idx) => update.run(idx + 1, id));
    });
    transaction(idList);
  },

  // Comparison Rows
  getRows() {
    return db.prepare('SELECT * FROM pricing_rows ORDER BY sort_order ASC, id ASC').all();
  },

  createRow(data) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM pricing_rows').get().m || 0;
    return db.prepare('INSERT INTO pricing_rows (feature, cells, sort_order, visible) VALUES (?, ?, ?, ?)')
      .run(data.feature, data.cells || '', maxSort + 1, data.visible ? 1 : 0).lastInsertRowid;
  },

  updateRow(id, data) {
    db.prepare('UPDATE pricing_rows SET feature = ?, cells = ?, visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(data.feature, data.cells || '', data.visible ? 1 : 0, id);
  },

  deleteRow(id) {
    db.prepare('DELETE FROM pricing_rows WHERE id = ?').run(id);
  },

  reorderRows(idList) {
    const update = db.prepare('UPDATE pricing_rows SET sort_order = ? WHERE id = ?');
    const transaction = db.transaction((ids) => {
      ids.forEach((id, idx) => update.run(idx + 1, id));
    });
    transaction(idList);
  }
};

// ==========================================
// 8. CHATBOT INTENTS
// ==========================================
const Chatbot = {
  getAll() {
    return db.prepare('SELECT * FROM chatbot_intents ORDER BY sort_order ASC, id ASC').all();
  },

  getVisible() {
    return db.prepare('SELECT * FROM chatbot_intents WHERE visible = 1 ORDER BY sort_order ASC, id ASC').all();
  },

  create(data) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM chatbot_intents').get().m || 0;
    return db.prepare(`
      INSERT INTO chatbot_intents (label, keywords, action, answer, chips, start, sort_order, visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.label, data.keywords || '', data.action || 'answer', data.answer || '',
      data.chips || '', data.start ? 1 : 0, maxSort + 1, data.visible ? 1 : 0
    ).lastInsertRowid;
  },

  update(id, data) {
    db.prepare(`
      UPDATE chatbot_intents SET
        label = ?, keywords = ?, action = ?, answer = ?, chips = ?, start = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.label, data.keywords || '', data.action || 'answer', data.answer || '',
      data.chips || '', data.start ? 1 : 0, data.visible ? 1 : 0, id
    );
  },

  delete(id) {
    db.prepare('DELETE FROM chatbot_intents WHERE id = ?').run(id);
  },

  reorder(idList) {
    const update = db.prepare('UPDATE chatbot_intents SET sort_order = ? WHERE id = ?');
    const transaction = db.transaction((ids) => {
      ids.forEach((id, idx) => update.run(idx + 1, id));
    });
    transaction(idList);
  },

  findResponse(query) {
    const q = String(query || '').toLowerCase().trim();
    const all = this.getVisible();
    if (!q) return null;

    // Check exact label match first
    for (const item of all) {
      if (item.label.toLowerCase() === q) return item;
    }

    // Check keywords
    for (const item of all) {
      if (!item.keywords) continue;
      const kwList = item.keywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      for (const kw of kwList) {
        if (q.includes(kw)) return item;
      }
    }

    return null;
  }
};

// ==========================================
// 9. NAVIGATION ITEMS
// ==========================================
const Nav = {
  getByArea(area) {
    return db.prepare('SELECT * FROM nav_items WHERE area = ? AND visible = 1 ORDER BY sort_order ASC, id ASC').all(area);
  },

  getAll() {
    return db.prepare('SELECT * FROM nav_items ORDER BY area ASC, sort_order ASC, id ASC').all();
  },

  create(data) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM nav_items WHERE area = ?').get(data.area).m || 0;
    return db.prepare('INSERT INTO nav_items (area, label, url, new_tab, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?)')
      .run(data.area, data.label, data.url, data.new_tab ? 1 : 0, maxSort + 1, data.visible ? 1 : 0).lastInsertRowid;
  },

  update(id, data) {
    db.prepare('UPDATE nav_items SET area = ?, label = ?, url = ?, new_tab = ?, visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(data.area, data.label, data.url, data.new_tab ? 1 : 0, data.visible ? 1 : 0, id);
  },

  delete(id) {
    db.prepare('DELETE FROM nav_items WHERE id = ?').run(id);
  },

  reorder(idList) {
    const update = db.prepare('UPDATE nav_items SET sort_order = ? WHERE id = ?');
    const transaction = db.transaction((ids) => {
      ids.forEach((id, idx) => update.run(idx + 1, id));
    });
    transaction(idList);
  }
};

// ==========================================
// 10. MEDIA LIBRARY
// ==========================================
const Media = {
  list() {
    return db.prepare('SELECT * FROM media ORDER BY created_at DESC').all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM media WHERE id = ?').get(id);
  },

  create(data) {
    return db.prepare(`
      INSERT INTO media (filename, original_name, filepath, mime_type, filesize, width, height, alt_text, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.filename, data.original_name, data.filepath, data.mime_type || '',
      data.filesize || 0, data.width || null, data.height || null, data.alt_text || '', data.uploaded_by || null
    ).lastInsertRowid;
  },

  update(id, { alt_text, filename }) {
    if (filename) {
      db.prepare('UPDATE media SET alt_text = ?, filename = ? WHERE id = ?').run(alt_text || '', filename, id);
    } else {
      db.prepare('UPDATE media SET alt_text = ? WHERE id = ?').run(alt_text || '', id);
    }
  },

  delete(id) {
    db.prepare('DELETE FROM media WHERE id = ?').run(id);
  }
};

// ==========================================
// 11. ENQUIRIES (INBOX / LEADS)
// ==========================================
const Enquiries = {
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO enquiries (
        name, contact, email, phone, business_name, service, budget, timeline, message,
        file_path, file_original_name, source, source_page, status, is_spam, ip_hash, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.name, data.contact, data.email || null, data.phone || null,
      data.business_name || null, data.service || null, data.budget || null,
      data.timeline || null, data.message || null, data.file_path || null,
      data.file_original_name || null, data.source || 'Contact Form',
      data.source_page || '/', 'New', data.is_spam ? 1 : 0, data.ip_hash || '', data.user_agent || ''
    );
    return info.lastInsertRowid;
  },

  list({ status, search, limit = 50, offset = 0, is_spam = 0 } = {}) {
    let sql = 'SELECT * FROM enquiries WHERE is_spam = ?';
    const params = [is_spam ? 1 : 0];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR contact LIKE ? OR business_name LIKE ? OR message LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  count({ status, is_spam = 0 } = {}) {
    let sql = 'SELECT COUNT(*) as count FROM enquiries WHERE is_spam = ?';
    const params = [is_spam ? 1 : 0];
    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    return db.prepare(sql).get(...params).count;
  },

  getStats() {
    const total = db.prepare('SELECT COUNT(*) as c FROM enquiries WHERE is_spam = 0').get().c;
    const newCount = db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE is_spam = 0 AND status = 'New'").get().c;
    const thisWeek = db.prepare(`
      SELECT COUNT(*) as c FROM enquiries 
      WHERE is_spam = 0 AND created_at >= datetime('now', '-7 days')
    `).get().c;
    return { total, newCount, thisWeek };
  },

  getById(id) {
    return db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id);
  },

  updateStatus(id, status) {
    db.prepare('UPDATE enquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  },

  updateDetails(id, fields) {
    const allowed = ['notes', 'tags', 'follow_up_date', 'status', 'is_spam'];
    const sets = [];
    const vals = [];
    for (const k of allowed) {
      if (fields[k] !== undefined) {
        sets.push(`${k} = ?`);
        vals.push(fields[k]);
      }
    }
    if (!sets.length) return;
    sets.push('updated_at = CURRENT_TIMESTAMP');
    vals.push(id);
    db.prepare(`UPDATE enquiries SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  },

  delete(id) {
    db.prepare('DELETE FROM enquiries WHERE id = ?').run(id);
  }
};

// ==========================================
// 12. ANALYTICS (FIRST-PARTY, COOKIELESS)
// ==========================================
const Analytics = {
  recordView(data) {
    return db.prepare(`
      INSERT INTO analytics_views (
        session_hash, path, referrer, source, utm_campaign,
        device_type, browser, screen_width, country, region, time_on_page
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.session_hash, data.path, data.referrer || '', data.source || 'Direct',
      data.utm_campaign || '', data.device_type || 'desktop', data.browser || '',
      data.screen_width || null, data.country || '', data.region || '', data.time_on_page || 0
    ).lastInsertRowid;
  },

  updateTimeOnPage(id, seconds) {
    db.prepare('UPDATE analytics_views SET time_on_page = ? WHERE id = ?').run(seconds, id);
  },

  recordEvent(data) {
    db.prepare(`
      INSERT INTO analytics_events (session_hash, event_type, event_label, event_value)
      VALUES (?, ?, ?, ?)
    `).run(data.session_hash, data.event_type, data.event_label || '', data.event_value || '');
  },

  getDashboardStats(days = 7) {
    const dateLimit = `datetime('now', '-${days} days')`;

    // Live visitors right now (active in last 5 minutes)
    const liveNow = db.prepare(`
      SELECT COUNT(DISTINCT session_hash) as count
      FROM analytics_views 
      WHERE created_at >= datetime('now', '-5 minutes')
    `).get().count;

    // Total views & unique visitors in range
    const totals = db.prepare(`
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT session_hash) as total_visitors,
        AVG(time_on_page) as avg_time
      FROM analytics_views
      WHERE created_at >= ${dateLimit}
    `).get();

    // Daily breakdown for chart
    const dailyViews = db.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT session_hash) as visitors
      FROM analytics_views
      WHERE created_at >= ${dateLimit}
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();

    // Top Pages
    const topPages = db.prepare(`
      SELECT path, COUNT(*) as views, COUNT(DISTINCT session_hash) as visitors
      FROM analytics_views
      WHERE created_at >= ${dateLimit}
      GROUP BY path
      ORDER BY views DESC LIMIT 8
    `).all();

    // Top Sources
    const topSources = db.prepare(`
      SELECT source, COUNT(*) as count
      FROM analytics_views
      WHERE created_at >= ${dateLimit}
      GROUP BY source
      ORDER BY count DESC LIMIT 6
    `).all();

    // Devices & Browsers
    const devices = db.prepare(`
      SELECT device_type, COUNT(*) as count
      FROM analytics_views
      WHERE created_at >= ${dateLimit}
      GROUP BY device_type
      ORDER BY count DESC
    `).all();

    return {
      liveNow,
      totalViews: totals.total_views || 0,
      totalVisitors: totals.total_visitors || 0,
      avgTimeSeconds: Math.round(totals.avg_time || 0),
      dailyViews,
      topPages,
      topSources,
      devices
    };
  },

  getFunnelStats(days = 30) {
    const dateLimit = `datetime('now', '-${days} days')`;

    const started = db.prepare(`
      SELECT COUNT(DISTINCT session_hash) as c 
      FROM analytics_events 
      WHERE event_type = 'form_start' AND created_at >= ${dateLimit}
    `).get().c;

    const submitted = db.prepare(`
      SELECT COUNT(DISTINCT session_hash) as c 
      FROM analytics_events 
      WHERE event_type = 'enquiry_submit' AND created_at >= ${dateLimit}
    `).get().c;

    const whatsappClicks = db.prepare(`
      SELECT COUNT(*) as c 
      FROM analytics_events 
      WHERE event_type = 'whatsapp_click' AND created_at >= ${dateLimit}
    `).get().c;

    const phoneClicks = db.prepare(`
      SELECT COUNT(*) as c 
      FROM analytics_events 
      WHERE event_type = 'phone_click' AND created_at >= ${dateLimit}
    `).get().c;

    const chatbotLeads = db.prepare(`
      SELECT COUNT(*) as c 
      FROM analytics_events 
      WHERE event_type = 'chatbot_lead' AND created_at >= ${dateLimit}
    `).get().c;

    return { started, submitted, whatsappClicks, phoneClicks, chatbotLeads };
  }
};

// ==========================================
// 13. REDIRECTS & 404 LOGS
// ==========================================
const Redirects = {
  find(path) {
    const r = db.prepare('SELECT * FROM redirects WHERE from_path = ?').get(path);
    if (r) {
      db.prepare('UPDATE redirects SET hits = hits + 1, last_hit_at = CURRENT_TIMESTAMP WHERE id = ?').run(r.id);
    }
    return r;
  },

  list() {
    return db.prepare('SELECT * FROM redirects ORDER BY created_at DESC').all();
  },

  create(from_path, to_path, status_code = 301) {
    return db.prepare('INSERT INTO redirects (from_path, to_path, status_code) VALUES (?, ?, ?)')
      .run(from_path, to_path, status_code).lastInsertRowid;
  },

  delete(id) {
    db.prepare('DELETE FROM redirects WHERE id = ?').run(id);
  },

  log404(path, referrer, ipHash, userAgent) {
    db.prepare('INSERT INTO error_404_logs (path, referrer, ip_hash, user_agent) VALUES (?, ?, ?, ?)')
      .run(path, referrer || '', ipHash || '', userAgent || '');
  },

  list404s(limit = 50) {
    return db.prepare(`
      SELECT path, COUNT(*) as hit_count, MAX(occurred_at) as last_seen, referrer
      FROM error_404_logs
      GROUP BY path
      ORDER BY hit_count DESC, last_seen DESC LIMIT ?
    `).all(limit);
  },

  clear404s() {
    db.prepare('DELETE FROM error_404_logs').run();
  }
};

// ==========================================
// 14. UPTIME & MAINTENANCE
// ==========================================
const Uptime = {
  log(status, responseTimeMs, statusCode, error = null) {
    db.prepare('INSERT INTO uptime_logs (status, response_time_ms, status_code, error_message) VALUES (?, ?, ?, ?)')
      .run(status, responseTimeMs, statusCode, error ? String(error) : null);
  },

  getStats(days = 30) {
    const totalPings = db.prepare(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) as up_count,
             AVG(response_time_ms) as avg_response
      FROM uptime_logs
      WHERE pinged_at >= datetime('now', '-${days} days')
    `).get();

    const percentage = totalPings.total > 0 ? ((totalPings.up_count / totalPings.total) * 100).toFixed(2) : 100;

    const incidents = db.prepare(`
      SELECT * FROM uptime_logs 
      WHERE status = 'DOWN' AND pinged_at >= datetime('now', '-${days} days')
      ORDER BY pinged_at DESC LIMIT 20
    `).all();

    return {
      percentage,
      avgResponseMs: Math.round(totalPings.avg_response || 0),
      totalPings: totalPings.total,
      incidents
    };
  },

  subscribeMaintenance(contact) {
    if (!contact) return;
    db.prepare('INSERT OR IGNORE INTO maintenance_subscribers (email) VALUES (?)').run(contact.trim());
  },

  listMaintenanceSubscribers() {
    return db.prepare('SELECT email, email as contact, created_at FROM maintenance_subscribers ORDER BY created_at DESC').all();
  },

  getRecentLogs(limit = 30) {
    return db.prepare('SELECT status, response_time_ms, status_code, pinged_at as created_at FROM uptime_logs ORDER BY pinged_at DESC LIMIT ?').all(limit);
  }
};

// ==========================================
// 15. AUDIT & ACTIVITY LOGS
// ==========================================
const Activity = {
  log(user, action, details, req = null) {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '';
    const ua = req ? req.headers['user-agent'] : '';
    db.prepare('INSERT INTO activity_logs (user_id, user_email, action, details, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)')
      .run(user ? user.id : null, user ? user.email : 'System', action, details || '', ip, ua);
  },

  list(limit = 100) {
    return db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  }
};

module.exports = {
  Settings,
  Users,
  Pages,
  Services,
  Brands,
  FAQs,
  Plans,
  Chatbot,
  Nav,
  Media,
  Enquiries,
  Analytics,
  Redirects,
  Uptime,
  Activity
};
