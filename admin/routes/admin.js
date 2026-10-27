'use strict';
/**
 * Admin Router for Explore Wings Digital Technologies.
 * Full dashboard, content editors, collection managers,
 * leads inbox, analytics, SEO, maintenance, users, and backups.
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const otplib = require('otplib');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const config = require('../../lib/config');
const {
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
} = require('../../db/queries');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { uploadImage, processUploadedImage } = require('../../lib/uploader');
const { sendMail } = require('../../lib/email');
const { createBackup, listBackups, restoreBackup } = require('../../lib/backup');
const { auditSeoHealth } = require('../../lib/seo');
const { cleanText, cleanMultiline, sanitizeRich, toCsv } = require('../../lib/sanitize');
const { iconSvg, ICON_OPTIONS } = require('../../lib/icons');

// Admin global layout locals
router.use((req, res, next) => {
  res.locals.settings = Settings.getAll();
  res.locals.adminTheme = res.locals.settings.default_theme || 'green';
  res.locals.siteName = res.locals.settings.site_name || 'Explore Wings Digital Technologies';
  res.locals.siteUrl = res.locals.settings.site_url || config.siteUrl;
  res.locals.newEnquiriesCount = Enquiries.getStats().newCount;
  res.locals.unreadEnquiriesCount = Enquiries.getStats().newCount;
  res.locals.iconSvg = iconSvg;
  res.locals.iconOptions = ICON_OPTIONS;
  res.locals.assetVersion = config.assetVersion;
  res.locals.user = req.user || null;
  next();
});

// ==========================================
// 1. AUTHENTICATION & LOGIN
// ==========================================
router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/admin');
  res.render('admin/login', {
    error: req.query.error || null,
    locked: false,
    require2fa: false
  });
});

router.post('/login', async (req, res) => {
  const { email, password, token2fa } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  if (!email || !password) {
    return res.render('admin/login', { error: 'Please enter your email and password.', locked: false, require2fa: false });
  }

  // Check lockout
  if (Users.isLockedOut(email, ip)) {
    return res.render('admin/login', {
      error: 'Too many failed login attempts. This account is locked for 15 minutes for security.',
      locked: true,
      require2fa: false
    });
  }

  const user = Users.findByEmail(email);
  if (!user || !user.active) {
    Users.recordLoginAttempt(email, ip, false);
    return res.render('admin/login', { error: 'Invalid email or password.', locked: false, require2fa: false });
  }

  const validPass = await bcrypt.compare(password, user.password_hash);
  if (!validPass) {
    Users.recordLoginAttempt(email, ip, false);
    return res.render('admin/login', { error: 'Invalid email or password.', locked: false, require2fa: false });
  }

  // Check 2FA if enabled
  if (user.two_factor_enabled && user.two_factor_secret) {
    if (!token2fa) {
      return res.render('admin/login', {
        error: null,
        locked: false,
        require2fa: true,
        email,
        password
      });
    }
    const validToken = otplib.authenticator.check(token2fa.trim(), user.two_factor_secret);
    if (!validToken) {
      Users.recordLoginAttempt(email, ip, false);
      return res.render('admin/login', {
        error: 'Invalid two-factor authentication code.',
        locked: false,
        require2fa: true,
        email,
        password
      });
    }
  }

  // Success
  Users.recordLoginAttempt(email, ip, true);
  Users.recordLogin(user.id, ip);
  req.session.userId = user.id;

  Activity.log(user, 'LOGIN', 'Admin logged in successfully', req);

  const returnTo = req.session.returnTo || '/admin';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

router.post('/logout', requireAuth, (req, res) => {
  Activity.log(req.user, 'LOGOUT', 'Admin logged out', req);
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// ==========================================
// 2. DASHBOARD
// ==========================================
router.get('/', requireAuth, (req, res) => {
  const enquiryStats = Enquiries.getStats();
  const analyticsStats = Analytics.getDashboardStats(7);
  const uptimeStats = Uptime.getStats(30);
  const maintenanceMode = Settings.get('maintenance_mode', 'off');
  const lastBackup = Settings.get('last_backup_at', null);
  const recentEnquiries = Enquiries.list({ limit: 5 });

  const visitorsToday = analyticsStats.todayVisitors || analyticsStats.uniqueVisitors || 0;
  const viewsToday = analyticsStats.todayViews || analyticsStats.totalViews || 0;
  const enquiriesWeek = enquiryStats.thisWeekCount || 0;
  const newEnquiries = enquiryStats.newCount || 0;
  const totalEnquiries = enquiryStats.total || 0;
  const conversionRate = totalEnquiries > 0 && analyticsStats.totalViews > 0
    ? Math.round((totalEnquiries / analyticsStats.totalViews) * 100 * 10) / 10
    : 0;

  res.render('admin/dashboard', {
    activeTab: 'dashboard',
    title: 'Dashboard Overview',
    stats: {
      visitorsToday,
      viewsToday,
      enquiriesWeek,
      newEnquiries,
      totalEnquiries,
      conversionRate
    },
    topPages: analyticsStats.topPages || [],
    recentEnquiries,
    siteStatus: (maintenanceMode === 'on' || maintenanceMode === 'true') ? 'Maintenance' : 'Live',
    lastBackup: lastBackup ? { created_at: lastBackup } : null,
    uptimeSummary: uptimeStats,
    enquiryStats,
    analyticsStats,
    uptimeStats
  });
});

// ==========================================
// 3. CONTENT EDITOR (PAGES & SECTIONS)
// ==========================================
router.get('/content/pages', (req, res) => res.redirect('/admin/pages'));
router.get('/content/pages/:slug', (req, res) => res.redirect('/admin/pages/' + req.params.slug));

router.get('/pages', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const pages = Pages.getAll();
  res.render('admin/content-pages', { pages, title: 'Pages Content Editor' });
});

router.get('/pages/:slug', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { slug } = req.params;
  const page = Pages.getBySlug(slug);
  if (!page) return res.redirect('/admin/pages');

  const sections = Pages.getSections(slug);
  const versions = Pages.getVersions('page', slug);

  res.render('admin/content-edit', {
    page,
    sections,
    versions,
    title: `Edit ${page.title} Page`,
    slug
  });
});

router.post('/pages/:slug', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { slug } = req.params;
  const { meta_title, meta_description, canonical_url, focus_keyword, status, sections } = req.body;

  const currentSections = Pages.getSections(slug);
  Pages.createVersion('page', slug, `Edited ${slug} page`, {
    meta_title,
    meta_description,
    canonical_url,
    focus_keyword,
    sections
  }, req.user.id);

  Pages.save(slug, {
    title: req.body.title || slug.toUpperCase(),
    meta_title: cleanText(meta_title, 200),
    meta_description: cleanMultiline(meta_description, 350),
    canonical_url: cleanText(canonical_url, 300),
    focus_keyword: cleanText(focus_keyword, 100),
    status: status || 'published'
  });

  // Save each submitted section
  if (sections && typeof sections === 'object') {
    for (const [secKey, secData] of Object.entries(sections)) {
      Pages.saveSection(slug, secKey, {
        title: cleanText(secData.title, 200),
        subtitle: cleanText(secData.subtitle, 500),
        body: secData.body_rich ? sanitizeRich(secData.body_rich) : cleanMultiline(secData.body, 5000),
        button_text: cleanText(secData.button_text, 60),
        button_url: cleanText(secData.button_url, 300),
        image_url: cleanText(secData.image_url, 300),
        extra: secData.extra || {}
      });
    }
  }

  Activity.log(req.user, 'EDIT_PAGE', `Updated page ${slug}`, req);
  req.session.success = `Page ${slug.toUpperCase()} and all sections published successfully!`;
  res.redirect(`/admin/pages/${slug}?saved=1`);
});

router.post('/pages/:slug/section/:secKey', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { slug, secKey } = req.params;
  const { title, subtitle, body, button_text, button_url, image_url } = req.body;

  Pages.saveSection(slug, secKey, {
    title: cleanText(title, 200),
    subtitle: cleanText(subtitle, 500),
    body: cleanMultiline(body, 5000),
    button_text: cleanText(button_text, 60),
    button_url: cleanText(button_url, 300),
    image_url: cleanText(image_url, 300)
  });

  Activity.log(req.user, 'EDIT_SECTION', `Updated section ${secKey} on page ${slug}`, req);
  req.session.success = `Section "${secKey}" updated and published successfully!`;
  res.redirect(`/admin/pages/${slug}#sec-${secKey}`);
});

router.post('/pages/:slug/section-add', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { slug } = req.params;
  const { section_key, title, subtitle, body, button_text, button_url, image_url } = req.body;
  const cleanKey = (section_key || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_').trim();

  if (!cleanKey) {
    req.session.error = 'Section key is required (e.g. "team", "features", "banner").';
    return res.redirect(`/admin/pages/${slug}`);
  }

  Pages.saveSection(slug, cleanKey, {
    title: cleanText(title, 200),
    subtitle: cleanText(subtitle, 500),
    body: cleanMultiline(body, 5000),
    button_text: cleanText(button_text, 60),
    button_url: cleanText(button_url, 300),
    image_url: cleanText(image_url, 300)
  });

  Activity.log(req.user, 'ADD_SECTION', `Added new section ${cleanKey} on page ${slug}`, req);
  req.session.success = `New section "${cleanKey}" added successfully!`;
  res.redirect(`/admin/pages/${slug}#sec-${cleanKey}`);
});

router.post('/pages/:slug/section/:secKey/delete', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { slug, secKey } = req.params;
  Pages.deleteSection(slug, secKey);
  Activity.log(req.user, 'DELETE_SECTION', `Deleted section ${secKey} from page ${slug}`, req);
  req.session.success = `Section "${secKey}" was removed.`;
  res.redirect(`/admin/pages/${slug}`);
});

router.post('/pages/:slug/restore/:versionId', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { slug, versionId } = req.params;
  const version = Pages.getVersionById(versionId);
  if (!version) return res.redirect(`/admin/pages/${slug}?error=version_not_found`);

  try {
    const data = JSON.parse(version.snapshot_json);
    Pages.save(slug, {
      title: slug.toUpperCase(),
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      canonical_url: data.canonical_url,
      focus_keyword: data.focus_keyword,
      status: 'published'
    });

    if (data.sections) {
      for (const [secKey, secData] of Object.entries(data.sections)) {
        Pages.saveSection(slug, secKey, secData);
      }
    }

    Activity.log(req.user, 'RESTORE_PAGE_VERSION', `Restored ${slug} to version #${versionId}`, req);
    res.redirect(`/admin/pages/${slug}?restored=1`);
  } catch (err) {
    res.redirect(`/admin/pages/${slug}?error=restore_failed`);
  }
});

// ==========================================
// 4. SERVICES MANAGEMENT
// ==========================================
router.get('/services', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const services = Services.getAll();
  res.render('admin/services-list', { services, title: 'Manage Services' });
});

router.post('/services/create', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { title, slug, short_desc, teaser, full_desc, included, best_for, delivery_note, cta_text, icon } = req.body;
  const serviceSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  Services.create({
    slug: serviceSlug,
    title: cleanText(title, 120),
    short_desc: cleanText(short_desc, 300),
    teaser: cleanMultiline(teaser, 700),
    full_desc: sanitizeRich(full_desc),
    included: cleanMultiline(included, 2000),
    best_for: cleanMultiline(best_for, 400),
    delivery_note: cleanText(delivery_note, 120),
    cta_text: cleanText(cta_text, 60),
    icon: icon || 'globe'
  });

  Activity.log(req.user, 'CREATE_SERVICE', `Added service: ${title}`, req);
  res.redirect('/admin/services');
});

router.post('/services/update/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { id } = req.params;
  const { title, slug, short_desc, teaser, full_desc, included, best_for, delivery_note, cta_text, icon, visible } = req.body;

  Services.update(id, {
    slug: cleanText(slug, 60),
    title: cleanText(title, 120),
    short_desc: cleanText(short_desc, 300),
    teaser: cleanMultiline(teaser, 700),
    full_desc: sanitizeRich(full_desc),
    included: cleanMultiline(included, 2000),
    best_for: cleanMultiline(best_for, 400),
    delivery_note: cleanText(delivery_note, 120),
    cta_text: cleanText(cta_text, 60),
    icon: icon || 'globe',
    visible: visible === '1' || visible === 'on'
  });

  Activity.log(req.user, 'UPDATE_SERVICE', `Updated service #${id}`, req);
  res.redirect('/admin/services');
});

router.post('/services/delete/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  Services.delete(req.params.id);
  Activity.log(req.user, 'DELETE_SERVICE', `Deleted service #${req.params.id}`, req);
  res.redirect('/admin/services');
});

router.post('/services/reorder', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids)) Services.reorder(ids);
  res.json({ success: true });
});

// ==========================================
// 5. BRANDS (CLIENT LOGOS)
// ==========================================
router.get('/brands', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const brands = Brands.getAll();
  res.render('admin/brands-list', { brands, title: 'Brands That Trust Us' });
});

router.post('/brands/create', requireAuth, requireRole('Owner', 'Editor'), uploadImage.single('logo_file'), async (req, res) => {
  const { name, url, logo_path } = req.body;
  let finalLogo = logo_path || '';

  if (req.file) {
    const processed = await processUploadedImage(req.file);
    finalLogo = processed.filepath;
    Media.create({
      filename: processed.filename,
      original_name: req.file.originalname,
      filepath: processed.filepath,
      mime_type: processed.mime_type,
      filesize: processed.filesize,
      width: processed.width,
      height: processed.height,
      alt_text: `${name} Logo`,
      uploaded_by: req.user.id
    });
  }

  if (name && finalLogo) {
    Brands.create({
      name: cleanText(name, 100),
      logo: finalLogo,
      url: cleanText(url, 300),
      visible: 1
    });
    Activity.log(req.user, 'ADD_BRAND', `Added brand: ${name}`, req);
  }

  res.redirect('/admin/brands');
});

router.post('/brands/update/:id', requireAuth, requireRole('Owner', 'Editor'), uploadImage.single('logo_file'), async (req, res) => {
  const { id } = req.params;
  const { name, url, logo_path, visible } = req.body;
  let finalLogo = logo_path;

  if (req.file) {
    const processed = await processUploadedImage(req.file);
    finalLogo = processed.filepath;
  }

  Brands.update(id, {
    name: cleanText(name, 100),
    logo: finalLogo,
    url: cleanText(url, 300),
    visible: visible === '1' || visible === 'on'
  });

  Activity.log(req.user, 'UPDATE_BRAND', `Updated brand #${id}`, req);
  res.redirect('/admin/brands');
});

router.post('/brands/delete/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  Brands.delete(req.params.id);
  Activity.log(req.user, 'DELETE_BRAND', `Deleted brand #${req.params.id}`, req);
  res.redirect('/admin/brands');
});

router.post('/brands/reorder', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids)) Brands.reorder(ids);
  res.json({ success: true });
});

// ==========================================
// 6. FAQS
// ==========================================
router.get('/faqs', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const faqs = FAQs.getAll();
  res.render('admin/faqs-list', { faqs, title: 'Manage FAQs' });
});

router.post('/faqs/create', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { question, answer } = req.body;
  if (question && answer) {
    FAQs.create({
      question: cleanText(question, 300),
      answer: sanitizeRich(answer)
    });
    Activity.log(req.user, 'CREATE_FAQ', `Added FAQ: ${question}`, req);
  }
  res.redirect('/admin/faqs');
});

router.post('/faqs/update/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { id } = req.params;
  const { question, answer, visible } = req.body;
  FAQs.update(id, {
    question: cleanText(question, 300),
    answer: sanitizeRich(answer),
    visible: visible === '1' || visible === 'on'
  });
  Activity.log(req.user, 'UPDATE_FAQ', `Updated FAQ #${id}`, req);
  res.redirect('/admin/faqs');
});

router.post('/faqs/delete/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  FAQs.delete(req.params.id);
  Activity.log(req.user, 'DELETE_FAQ', `Deleted FAQ #${req.params.id}`, req);
  res.redirect('/admin/faqs');
});

router.post('/faqs/reorder', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids)) FAQs.reorder(ids);
  res.json({ success: true });
});

// ==========================================
// 7. PRICING PLANS & COMPARISON
// ==========================================
router.get('/plans', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const plans = Plans.getAll();
  const rows = Plans.getRows();
  res.render('admin/plans-list', { plans, rows, title: 'Pricing Plans & Matrix' });
});

router.post('/plans/create', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { name, description, delivery, features, highlighted, badge, button_text, button_link } = req.body;
  Plans.create({
    name: cleanText(name, 80),
    description: cleanText(description, 300),
    delivery: cleanText(delivery, 80),
    features: cleanMultiline(features, 2000),
    highlighted: highlighted === '1' || highlighted === 'on',
    badge: cleanText(badge, 40),
    button_text: cleanText(button_text, 40),
    button_link: cleanText(button_link, 200)
  });
  res.redirect('/admin/plans');
});

router.post('/plans/update/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { id } = req.params;
  const { name, description, delivery, features, highlighted, badge, button_text, button_link, visible } = req.body;
  Plans.update(id, {
    name: cleanText(name, 80),
    description: cleanText(description, 300),
    delivery: cleanText(delivery, 80),
    features: cleanMultiline(features, 2000),
    highlighted: highlighted === '1' || highlighted === 'on',
    badge: cleanText(badge, 40),
    button_text: cleanText(button_text, 40),
    button_link: cleanText(button_link, 200),
    visible: visible === '1' || visible === 'on'
  });
  res.redirect('/admin/plans');
});

router.post('/plans/delete/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  Plans.delete(req.params.id);
  res.redirect('/admin/plans');
});

// Comparison Rows
router.post('/plans/rows/create', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { feature, cells } = req.body;
  Plans.createRow({
    feature: cleanText(feature, 120),
    cells: cleanMultiline(cells, 1000)
  });
  res.redirect('/admin/plans');
});

router.post('/plans/rows/update/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { id } = req.params;
  const { feature, cells, visible } = req.body;
  Plans.updateRow(id, {
    feature: cleanText(feature, 120),
    cells: cleanMultiline(cells, 1000),
    visible: visible === '1' || visible === 'on'
  });
  res.redirect('/admin/plans');
});

router.post('/plans/rows/delete/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  Plans.deleteRow(req.params.id);
  res.redirect('/admin/plans');
});

// ==========================================
// 8. CHATBOT MANAGER
// ==========================================
router.get('/chatbot', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const intents = Chatbot.getAll();
  res.render('admin/chatbot-list', { intents, title: 'Chatbot Intents & Test' });
});

router.post('/chatbot/create', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { label, keywords, action, answer, chips, start } = req.body;
  Chatbot.create({
    label: cleanText(label, 80),
    keywords: cleanText(keywords, 400),
    action: action || 'answer',
    answer: cleanMultiline(answer, 2000),
    chips: cleanText(chips, 300),
    start: start === '1' || start === 'on'
  });
  res.redirect('/admin/chatbot');
});

router.post('/chatbot/update/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { id } = req.params;
  const { label, keywords, action, answer, chips, start, visible } = req.body;
  Chatbot.update(id, {
    label: cleanText(label, 80),
    keywords: cleanText(keywords, 400),
    action: action || 'answer',
    answer: cleanMultiline(answer, 2000),
    chips: cleanText(chips, 300),
    start: start === '1' || start === 'on',
    visible: visible === '1' || visible === 'on'
  });
  res.redirect('/admin/chatbot');
});

router.post('/chatbot/delete/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  Chatbot.delete(req.params.id);
  res.redirect('/admin/chatbot');
});

// ==========================================
// 9. NAVIGATION & FOOTER
// ==========================================
router.get('/navigation', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const navItems = Nav.getAll();
  const settings = Settings.getAll();
  res.render('admin/navigation-list', { navItems, settings, title: 'Navigation & Contact Info' });
});

router.post('/navigation/create', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { area, label, url, new_tab } = req.body;
  Nav.create({
    area: area || 'header',
    label: cleanText(label, 60),
    url: cleanText(url, 300),
    new_tab: new_tab === '1' || new_tab === 'on'
  });
  res.redirect('/admin/navigation');
});

router.post('/navigation/update/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { id } = req.params;
  const { area, label, url, new_tab, visible } = req.body;
  Nav.update(id, {
    area,
    label: cleanText(label, 60),
    url: cleanText(url, 300),
    new_tab: new_tab === '1' || new_tab === 'on',
    visible: visible === '1' || visible === 'on'
  });
  res.redirect('/admin/navigation');
});

router.post('/navigation/delete/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  Nav.delete(req.params.id);
  res.redirect('/admin/navigation');
});

router.post('/navigation/contact-info', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { phone, email, whatsapp, address, hours, instagram, facebook, linkedin } = req.body;
  Settings.setMultiple({
    phone: cleanText(phone, 40),
    email: cleanText(email, 100),
    whatsapp: cleanText(whatsapp, 40),
    address: cleanText(address, 200),
    hours: cleanText(hours, 100),
    instagram: cleanText(instagram, 300),
    facebook: cleanText(facebook, 300),
    linkedin: cleanText(linkedin, 300)
  });
  Activity.log(req.user, 'UPDATE_CONTACT_INFO', 'Updated studio contact details', req);
  res.redirect('/admin/navigation?saved=1');
});

// ==========================================
// 10. MEDIA LIBRARY
// ==========================================
router.get('/media', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const items = Media.list();
  res.render('admin/media-list', { items, title: 'Media Library' });
});

router.post('/media/upload', requireAuth, requireRole('Owner', 'Editor'), uploadImage.single('file'), async (req, res) => {
  if (!req.file) return res.redirect('/admin/media?error=no_file');

  const { alt_text } = req.body;
  if (!alt_text || !alt_text.trim()) {
    return res.redirect('/admin/media?error=alt_text_required');
  }

  const processed = await processUploadedImage(req.file);
  Media.create({
    filename: processed.filename,
    original_name: req.file.originalname,
    filepath: processed.filepath,
    mime_type: processed.mime_type,
    filesize: processed.filesize,
    width: processed.width,
    height: processed.height,
    alt_text: cleanText(alt_text, 250),
    uploaded_by: req.user.id
  });

  Activity.log(req.user, 'UPLOAD_MEDIA', `Uploaded image: ${processed.filename}`, req);
  res.redirect('/admin/media');
});

router.post('/media/update/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { id } = req.params;
  const { alt_text } = req.body;
  Media.update(id, { alt_text: cleanText(alt_text, 250) });
  res.redirect('/admin/media');
});

router.post('/media/delete/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const item = Media.getById(req.params.id);
  if (item) {
    const fullPath = path.join(config.publicDir, item.filepath);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (e) {}
    }
    Media.delete(req.params.id);
    Activity.log(req.user, 'DELETE_MEDIA', `Deleted image #${req.params.id}`, req);
  }
  res.redirect('/admin/media');
});

// ==========================================
// 11. ENQUIRIES INBOX (LEADS)
// ==========================================
router.get('/enquiries', requireAuth, (req, res) => {
  const { status, search, spam, page = 1 } = req.query;
  const limit = 25;
  const offset = (parseInt(page, 10) - 1) * limit;

  const isSpam = spam === '1';
  const enquiries = Enquiries.list({ status, search, limit, offset, is_spam: isSpam });
  const total = Enquiries.count({ status, is_spam: isSpam });
  const stats = Enquiries.getStats();

  res.render('admin/enquiries-list', {
    enquiries,
    total,
    stats,
    currentStatus: status || 'all',
    search: search || '',
    isSpam,
    currentPage: parseInt(page, 10),
    totalPages: Math.ceil(total / limit) || 1,
    title: isSpam ? 'Spam Enquiries' : 'Enquiries Inbox'
  });
});

router.get('/enquiries/:id', requireAuth, (req, res) => {
  const enquiry = Enquiries.getById(req.params.id);
  if (!enquiry) return res.redirect('/admin/enquiries');
  res.render('admin/enquiry-detail', { enquiry, title: `Enquiry #${enquiry.id} - ${enquiry.name}` });
});

router.post('/enquiries/:id/update', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { id } = req.params;
  const { status, notes, tags, follow_up_date, is_spam } = req.body;

  Enquiries.updateDetails(id, {
    status,
    notes: cleanMultiline(notes, 3000),
    tags: cleanText(tags, 200),
    follow_up_date: follow_up_date || null,
    is_spam: is_spam === '1' ? 1 : 0
  });

  Activity.log(req.user, 'UPDATE_ENQUIRY', `Updated enquiry #${id} status to ${status}`, req);
  res.redirect(`/admin/enquiries/${id}`);
});

router.post('/enquiries/:id/delete', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  Enquiries.delete(req.params.id);
  Activity.log(req.user, 'DELETE_ENQUIRY', `Deleted enquiry #${req.params.id}`, req);
  res.redirect('/admin/enquiries');
});

// CSV Export
router.get('/enquiries/export.csv', requireAuth, (req, res) => {
  const list = Enquiries.list({ limit: 1000, is_spam: 0 });
  const headers = ['ID', 'Date', 'Name', 'Contact', 'Email', 'Phone', 'Business', 'Service', 'Status', 'Source', 'Message'];
  const rows = list.map(e => [
    e.id,
    e.created_at,
    e.name,
    e.contact,
    e.email || '',
    e.phone || '',
    e.business_name || '',
    e.service || '',
    e.status,
    e.source,
    e.message || ''
  ]);

  const csv = toCsv(headers, rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="enquiries_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// ==========================================
// 12. ANALYTICS DASHBOARD
// ==========================================
router.get('/analytics', requireAuth, (req, res) => {
  const days = parseInt(req.query.days || '7', 10);
  const stats = Analytics.getDashboardStats(days);
  const funnel = Analytics.getFunnelStats(days);

  res.render('admin/analytics-view', {
    stats,
    funnel,
    days,
    title: 'Analytics & Traffic Insights'
  });
});

// ==========================================
// 13. SEO MANAGER
// ==========================================
router.get('/seo', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const health = auditSeoHealth();
  const redirects = Redirects.list();
  const logs404 = Redirects.list404s(20);
  const settings = Settings.getAll();

  res.render('admin/seo-manager', {
    health,
    redirects,
    logs404,
    settings,
    title: 'SEO Manager & Health'
  });
});

router.post('/seo/settings', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { site_name, site_url, default_share_image, ga4_id, gsc_verification_tag } = req.body;
  Settings.setMultiple({
    site_name: cleanText(site_name, 100),
    site_url: cleanText(site_url, 300),
    og_default_image: cleanText(default_share_image, 300),
    ga4_id: cleanText(ga4_id, 40),
    gsc_verification_tag: cleanText(gsc_verification_tag, 200)
  });
  Activity.log(req.user, 'UPDATE_SEO_SETTINGS', 'Updated site-wide SEO settings', req);
  res.redirect('/admin/seo?saved=1');
});

router.post('/seo/redirects/create', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { from_path, to_path, status_code } = req.body;
  if (from_path && to_path) {
    Redirects.create(
      cleanText(from_path, 300),
      cleanText(to_path, 300),
      parseInt(status_code || '301', 10)
    );
  }
  res.redirect('/admin/seo');
});

router.post('/seo/redirects/delete/:id', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  Redirects.delete(req.params.id);
  res.redirect('/admin/seo');
});

router.post('/seo/404/clear', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  Redirects.clear404s();
  res.redirect('/admin/seo');
});

// ==========================================
// 14. WEBSITE STATUS & MAINTENANCE
// ==========================================
router.get('/maintenance', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const settings = Settings.getAll();
  const uptime = Uptime.getStats(30);
  const subscribers = Uptime.listMaintenanceSubscribers();
  const uptimeLogs = Uptime.getRecentLogs(30);

  res.render('admin/maintenance-view', {
    settings,
    uptime,
    subscribers,
    uptimeLogs,
    title: 'Website Status & Maintenance'
  });
});

router.post('/maintenance/toggle', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const current = Settings.get('maintenance_mode', 'off');
  const isCurrentlyActive = (current === 'on' || current === 'true' || current === '1');
  const nextMode = isCurrentlyActive ? 'off' : 'on';
  Settings.set('maintenance_mode', nextMode);
  
  Activity.log(req.user, 'TOGGLE_MAINTENANCE', `Toggled maintenance mode to ${nextMode}`, req);
  req.session.success = nextMode === 'on'
    ? 'Maintenance Mode is now ACTIVE. Public visitors are blocked and will see the 503 maintenance page.'
    : 'Maintenance Mode has been DISABLED. The website is now live to all public visitors!';

  const referer = req.get('Referer') || '/admin/maintenance';
  res.redirect(referer);
});

router.post('/maintenance/save', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { maintenance_message, maintenance_end, maintenance_return_time, maintenance_bypass_token, maintenance_allow_notify } = req.body;

  Settings.setMultiple({
    maintenance_message: cleanMultiline(maintenance_message, 1000),
    maintenance_return_time: cleanText(maintenance_end || maintenance_return_time || '', 100),
    maintenance_end: cleanText(maintenance_end || maintenance_return_time || '', 100),
    maintenance_bypass_token: cleanText(maintenance_bypass_token || 'ew-preview', 50),
    maintenance_allow_notify: maintenance_allow_notify === '0' ? '0' : '1'
  });

  Activity.log(req.user, 'UPDATE_MAINTENANCE_CONFIG', 'Updated maintenance page message and parameters', req);
  req.session.success = 'Maintenance configuration updated successfully.';
  res.redirect('/admin/maintenance');
});

router.post('/maintenance', requireAuth, requireRole('Owner', 'Editor'), (req, res) => {
  const { maintenance_mode, maintenance_message, maintenance_end, maintenance_return_time, maintenance_bypass_token, maintenance_allow_notify } = req.body;

  if (maintenance_mode !== undefined) {
    const isMaint = (maintenance_mode === 'on' || maintenance_mode === 'true' || maintenance_mode === '1');
    Settings.set('maintenance_mode', isMaint ? 'on' : 'off');
  }

  Settings.setMultiple({
    maintenance_message: cleanMultiline(maintenance_message, 1000),
    maintenance_return_time: cleanText(maintenance_end || maintenance_return_time || '', 100),
    maintenance_end: cleanText(maintenance_end || maintenance_return_time || '', 100),
    maintenance_bypass_token: cleanText(maintenance_bypass_token || 'ew-preview', 50),
    maintenance_allow_notify: maintenance_allow_notify === '0' ? '0' : '1'
  });

  Activity.log(req.user, 'UPDATE_MAINTENANCE', `Updated maintenance mode and settings`, req);
  req.session.success = 'Maintenance configuration saved successfully.';
  res.redirect('/admin/maintenance');
});

// ==========================================
// 15. USERS & SECURITY
// ==========================================
router.get('/users', requireAuth, requireRole('Owner'), (req, res) => {
  const users = Users.list();
  res.render('admin/users-list', { users, title: 'Users & Roles' });
});

router.post('/users/create', requireAuth, requireRole('Owner'), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.redirect('/admin/users?error=fields_required');
  }

  const existing = Users.findByEmail(email);
  if (existing) {
    return res.redirect('/admin/users?error=email_exists');
  }

  const hash = await bcrypt.hash(password, 12);
  Users.create({
    name: cleanText(name, 100),
    email: cleanText(email, 120),
    password_hash: hash,
    role: role || 'Editor'
  });

  Activity.log(req.user, 'CREATE_USER', `Created user account for ${email}`, req);
  res.redirect('/admin/users');
});

router.post('/users/update/:id', requireAuth, requireRole('Owner'), (req, res) => {
  const { id } = req.params;
  const { name, email, role, active } = req.body;

  // Prevent disabling self
  const isActive = (parseInt(id, 10) === req.user.id) ? 1 : (active === '1' || active === 'on' ? 1 : 0);

  Users.update(id, {
    name: cleanText(name, 100),
    email: cleanText(email, 120),
    role,
    active: isActive
  });

  Activity.log(req.user, 'UPDATE_USER', `Updated user #${id}`, req);
  res.redirect('/admin/users');
});

router.post('/users/delete/:id', requireAuth, requireRole('Owner'), (req, res) => {
  const { id } = req.params;
  if (parseInt(id, 10) === req.user.id) {
    return res.redirect('/admin/users?error=cannot_delete_self');
  }

  Users.delete(id);
  Activity.log(req.user, 'DELETE_USER', `Deleted user #${id}`, req);
  res.redirect('/admin/users');
});

// Two-Factor Authentication Setup
router.get('/security/2fa', requireAuth, async (req, res) => {
  const secret = otplib.authenticator.generateSecret();
  const otpauth = otplib.authenticator.keyuri(req.user.email, 'Explore Wings Digital', secret);
  const qrDataUrl = await qrcode.toDataURL(otpauth);

  req.session.pending2faSecret = secret;

  res.render('admin/security-2fa', {
    secret,
    qrDataUrl,
    enabled: req.user.two_factor_enabled,
    title: 'Two-Factor Authentication'
  });
});

router.post('/security/2fa/verify', requireAuth, (req, res) => {
  const { token } = req.body;
  const secret = req.session.pending2faSecret;

  if (!secret || !token) return res.redirect('/admin/security/2fa?error=invalid_token');

  const valid = otplib.authenticator.check(token.trim(), secret);
  if (!valid) {
    return res.redirect('/admin/security/2fa?error=incorrect_code');
  }

  Users.update(req.user.id, {
    two_factor_secret: secret,
    two_factor_enabled: 1
  });
  delete req.session.pending2faSecret;

  Activity.log(req.user, 'ENABLE_2FA', 'Activated Two-Factor Authentication', req);
  res.redirect('/admin/security/2fa?success=enabled');
});

router.post('/security/2fa/disable', requireAuth, (req, res) => {
  Users.update(req.user.id, {
    two_factor_secret: null,
    two_factor_enabled: 0
  });
  Activity.log(req.user, 'DISABLE_2FA', 'Disabled Two-Factor Authentication', req);
  res.redirect('/admin/security/2fa?disabled=1');
});

// ==========================================
// 16. SETTINGS & BACKUPS
// ==========================================
router.get('/settings', requireAuth, requireRole('Owner'), (req, res) => {
  const settings = Settings.getAll();
  res.render('admin/settings-view', { settings, title: 'System & Email Settings' });
});

router.post('/settings', requireAuth, requireRole('Owner'), (req, res) => {
  const {
    smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from,
    notification_email, auto_reply_enabled, uptime_alert_email, analytics_retention_months
  } = req.body;

  Settings.setMultiple({
    smtp_host: cleanText(smtp_host, 200),
    smtp_port: cleanText(smtp_port, 10),
    smtp_secure: smtp_secure === 'true' ? 'true' : 'false',
    smtp_user: cleanText(smtp_user, 120),
    smtp_pass: smtp_pass || Settings.get('smtp_pass', ''),
    smtp_from: cleanText(smtp_from, 120),
    notification_email: cleanText(notification_email, 120),
    auto_reply_enabled: auto_reply_enabled === '1' ? '1' : '0',
    uptime_alert_email: cleanText(uptime_alert_email, 120),
    analytics_retention_months: cleanText(analytics_retention_months, 10)
  });

  Activity.log(req.user, 'UPDATE_SETTINGS', 'Updated system & SMTP settings', req);
  res.redirect('/admin/settings?saved=1');
});

router.post('/settings/test-email', requireAuth, requireRole('Owner'), async (req, res) => {
  const target = req.body.test_email || req.user.email;
  const result = await sendMail({
    to: target,
    subject: 'Explore Wings Test Email',
    text: 'This is a confirmation test email from your Explore Wings Digital website server.'
  });

  if (result.success) {
    res.redirect('/admin/settings?test_sent=1');
  } else {
    res.redirect(`/admin/settings?test_error=${encodeURIComponent(result.error || 'Failed')}`);
  }
});

router.post('/settings/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  if (!current_password || !new_password || new_password !== confirm_password) {
    return res.redirect('/admin/settings?error=password_mismatch');
  }

  const user = Users.findById(req.user.id);
  const match = await bcrypt.compare(current_password, user.password_hash);
  if (!match) {
    return res.redirect('/admin/settings?error=wrong_current_password');
  }

  const hash = await bcrypt.hash(new_password, 12);
  Users.update(user.id, { password_hash: hash });
  Activity.log(req.user, 'CHANGE_PASSWORD', 'User updated password', req);

  res.redirect('/admin/settings?password_updated=1');
});

// Backups
router.get('/backups', requireAuth, requireRole('Owner'), (req, res) => {
  const backups = listBackups();
  const lastBackup = Settings.get('last_backup_at', 'Never');
  res.render('admin/backups-view', { backups, lastBackup, title: 'Database Backups' });
});

router.post('/backups/create', requireAuth, requireRole('Owner'), async (req, res) => {
  try {
    await createBackup('admin_manual');
    Activity.log(req.user, 'MANUAL_BACKUP', 'Created manual SQLite backup snapshot', req);
    res.redirect('/admin/backups?created=1');
  } catch (err) {
    res.redirect(`/admin/backups?error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/backups/download/:filename', requireAuth, requireRole('Owner'), (req, res) => {
  const filename = path.basename(req.params.filename);
  const target = path.join(config.backupDir, filename);
  if (fs.existsSync(target)) {
    res.download(target, filename);
  } else {
    res.redirect('/admin/backups?error=file_not_found');
  }
});

router.post('/backups/restore/:filename', requireAuth, requireRole('Owner'), async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    await restoreBackup(filename);
    Activity.log(req.user, 'RESTORE_BACKUP', `Restored database from ${filename}`, req);
    res.redirect('/admin/backups?restored=1');
  } catch (err) {
    res.redirect(`/admin/backups?error=${encodeURIComponent(err.message)}`);
  }
});

// Activity Audit Log
router.get('/logs', requireAuth, requireRole('Owner'), (req, res) => {
  const logs = Activity.list(100);
  res.render('admin/logs-view', { logs, title: 'Activity Audit Log' });
});

module.exports = router;
