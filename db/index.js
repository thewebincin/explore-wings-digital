'use strict';
/**
 * Database schema and connection management using better-sqlite3.
 * Single data layer for all queries - clean, parameterized, migration-ready.
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../lib/config');

// Ensure data directory exists
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}
if (!fs.existsSync(config.privateUploadsDir)) {
  fs.mkdirSync(config.privateUploadsDir, { recursive: true });
}
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

const db = new Database(config.dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    -- Settings table (key-value store for site config, SEO, branding, maintenance)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table (Owner, Editor, Viewer)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Editor', -- 'Owner', 'Editor', 'Viewer'
      two_factor_secret TEXT,
      two_factor_enabled INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      last_login_at TEXT,
      last_login_ip TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Login attempts (for rate limiting / lockout on brute force)
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      ip TEXT NOT NULL,
      success INTEGER NOT NULL,
      attempted_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Pages content table (Home, Services, Pricing, About, Contact)
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL, -- 'home', 'services', 'pricing', 'about', 'contact'
      title TEXT NOT NULL,
      meta_title TEXT,
      meta_description TEXT,
      canonical_url TEXT,
      focus_keyword TEXT,
      og_image TEXT,
      status TEXT DEFAULT 'published', -- 'published', 'draft'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Page sections (structured content blocks for each page)
    CREATE TABLE IF NOT EXISTS page_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      section_key TEXT NOT NULL, -- e.g., 'hero', 'bold_statement', 'founder_note'
      title TEXT,
      subtitle TEXT,
      body TEXT,
      button_text TEXT,
      button_url TEXT,
      image_url TEXT,
      extra_json TEXT, -- flexible JSON for specific section fields
      sort_order INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(page_id, section_key)
    );

    -- Content versions (revision history with one-click restore)
    CREATE TABLE IF NOT EXISTS content_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL, -- 'page', 'service', 'brand', 'settings'
      entity_id TEXT NOT NULL,
      title TEXT,
      snapshot_json TEXT NOT NULL,
      created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Services collection
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      short_desc TEXT,
      teaser TEXT,
      full_desc TEXT,
      included TEXT, -- newline-separated or JSON array
      best_for TEXT,
      delivery_note TEXT,
      cta_text TEXT DEFAULT 'Enquire about service',
      icon TEXT DEFAULT 'globe',
      image TEXT,
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Brands that trust us
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT NOT NULL,
      url TEXT,
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- FAQs
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Pricing plans
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      delivery TEXT,
      features TEXT, -- newline-separated list
      highlighted INTEGER DEFAULT 0,
      badge TEXT,
      button_text TEXT DEFAULT 'Get a quote',
      button_link TEXT DEFAULT 'contact.html',
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Pricing comparison rows
    CREATE TABLE IF NOT EXISTS pricing_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature TEXT NOT NULL,
      cells TEXT NOT NULL, -- newline-separated values corresponding to each visible plan
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Chatbot intents & replies
    CREATE TABLE IF NOT EXISTS chatbot_intents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      keywords TEXT, -- comma-separated
      action TEXT DEFAULT 'answer', -- 'answer', 'lead'
      answer TEXT,
      chips TEXT, -- comma-separated follow-up chips
      start INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Navigation links (header, footer_nav, footer_services)
    CREATE TABLE IF NOT EXISTS nav_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area TEXT NOT NULL, -- 'header', 'footer_nav', 'footer_services'
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      new_tab INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Media Library
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      filepath TEXT NOT NULL,
      mime_type TEXT,
      filesize INTEGER,
      width INTEGER,
      height INTEGER,
      alt_text TEXT NOT NULL DEFAULT '',
      used_in TEXT, -- comma-separated entity tags
      uploaded_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Enquiries inbox (Leads from contact form, hero consultation, chatbot)
    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT NOT NULL, -- phone or email
      email TEXT,
      phone TEXT,
      business_name TEXT,
      service TEXT,
      budget TEXT,
      timeline TEXT,
      message TEXT,
      file_path TEXT,
      file_original_name TEXT,
      source TEXT NOT NULL DEFAULT 'Contact Form', -- 'Contact Form', 'Hero Consultation', 'Chatbot'
      source_page TEXT,
      status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Contacted', 'Quote Sent', 'Won', 'Lost'
      is_spam INTEGER DEFAULT 0,
      notes TEXT,
      tags TEXT,
      follow_up_date TEXT,
      ip_hash TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Analytics: Page views (first-party, privacy-friendly, cookieless)
    CREATE TABLE IF NOT EXISTS analytics_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_hash TEXT NOT NULL, -- daily salt + ip + ua hash
      path TEXT NOT NULL,
      referrer TEXT,
      source TEXT, -- 'Direct', 'Google', 'Instagram', 'WhatsApp', 'Other'
      utm_campaign TEXT,
      device_type TEXT, -- 'desktop', 'mobile', 'tablet'
      browser TEXT,
      screen_width INTEGER,
      country TEXT,
      region TEXT, -- e.g., Kerala
      time_on_page INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Analytics: Events (conversions, clicks, funnel)
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_hash TEXT NOT NULL,
      event_type TEXT NOT NULL, -- 'consultation_submit', 'enquiry_submit', 'form_start', 'chatbot_open', 'chatbot_lead', 'whatsapp_click', 'phone_click', 'auto_scroll_toggle', 'theme_change'
      event_label TEXT,
      event_value TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- SEO: Redirects manager
    CREATE TABLE IF NOT EXISTS redirects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_path TEXT UNIQUE NOT NULL,
      to_path TEXT NOT NULL,
      status_code INTEGER DEFAULT 301,
      hits INTEGER DEFAULT 0,
      last_hit_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- SEO: 404 error log
    CREATE TABLE IF NOT EXISTS error_404_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      referrer TEXT,
      ip_hash TEXT,
      user_agent TEXT,
      occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Uptime monitor pings & downtime events
    CREATE TABLE IF NOT EXISTS uptime_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL, -- 'UP', 'DOWN'
      response_time_ms INTEGER,
      status_code INTEGER,
      error_message TEXT,
      pinged_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Maintenance notifications queue (visitors who asked to be notified)
    CREATE TABLE IF NOT EXISTS maintenance_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Activity log (audit trail for admin actions)
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initSchema();

module.exports = {
  db,
  initSchema
};
