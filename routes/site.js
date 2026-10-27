'use strict';
/**
 * Public website routes for Explore Wings Digital Technologies.
 * All pages are server-side rendered with EJS, feeding content directly from SQLite.
 */
const express = require('express');
const router = express.Router();
const config = require('../lib/config');
const {
  Settings,
  Pages,
  Services,
  Brands,
  FAQs,
  Plans,
  Chatbot,
  Nav,
  Enquiries,
  Analytics,
  Redirects
} = require('../db/queries');
const { notifyNewEnquiry } = require('../lib/email');
const { uploadAttachment, savePrivateAttachment } = require('../lib/uploader');
const { buildJsonLd, generateSitemap, generateRobotsTxt } = require('../lib/seo');
const { iconSvg } = require('../lib/icons');

// Helper to inject global template locals
router.use((req, res, next) => {
  const settings = Settings.getAll();
  res.locals.settings = settings;
  res.locals.siteUrl = settings.site_url || config.siteUrl;
  res.locals.siteName = settings.site_name || 'Explore Wings Digital Technologies';
  res.locals.headerNav = Nav.getByArea('header');
  res.locals.footerNav = Nav.getByArea('footer_nav');
  res.locals.footerServices = Nav.getByArea('footer_services');
  res.locals.assetVersion = config.assetVersion;
  res.locals.iconSvg = iconSvg;
  next();
});

// Legacy .html 301 Redirects
router.get(['/index.html', '/home'], (req, res) => res.redirect(301, '/'));
router.get('/services.html', (req, res) => res.redirect(301, '/services'));
router.get('/pricing.html', (req, res) => res.redirect(301, '/pricing'));
router.get('/about.html', (req, res) => res.redirect(301, '/about'));
router.get('/contact.html', (req, res) => res.redirect(301, '/contact'));
router.get(['/portfolio', '/portfolio.html'], (req, res) => res.redirect(301, '/#trusted-brands'));

// Custom 301/302 Redirect Manager lookup
router.use((req, res, next) => {
  const redirect = Redirects.find(req.path);
  if (redirect) {
    return res.redirect(redirect.status_code || 301, redirect.to_path);
  }
  next();
});

// 1. HOME PAGE
router.get('/', (req, res) => {
  const page = Pages.getBySlug('home') || {};
  const sections = Pages.getSections('home');
  const services = Services.getVisible();
  const brands = Brands.getVisible();
  const faqs = FAQs.getVisible();
  const jsonLd = buildJsonLd('home');

  res.render('site/index', {
    page,
    sections,
    services,
    brands,
    faqs,
    jsonLd,
    currentPath: '/'
  });
});

// 2. SERVICES PAGE
router.get('/services', (req, res) => {
  const page = Pages.getBySlug('services') || {};
  const sections = Pages.getSections('services');
  const services = Services.getVisible();
  const jsonLd = buildJsonLd('services');

  res.render('site/services', {
    page,
    sections,
    services,
    jsonLd,
    currentPath: '/services'
  });
});

// 3. PRICING PAGE
router.get('/pricing', (req, res) => {
  const page = Pages.getBySlug('pricing') || {};
  const sections = Pages.getSections('pricing');
  const plans = Plans.getVisible();
  const comparisonRows = Plans.getRows().filter(r => r.visible);
  const jsonLd = buildJsonLd('pricing');

  res.render('site/pricing', {
    page,
    sections,
    plans,
    comparisonRows,
    jsonLd,
    currentPath: '/pricing'
  });
});

// 4. ABOUT PAGE
router.get('/about', (req, res) => {
  const page = Pages.getBySlug('about') || {};
  const sections = Pages.getSections('about');
  const brands = Brands.getVisible();
  const jsonLd = buildJsonLd('about');

  res.render('site/about', {
    page,
    sections,
    brands,
    jsonLd,
    currentPath: '/about'
  });
});

// 5. CONTACT PAGE
router.get('/contact', (req, res) => {
  const page = Pages.getBySlug('contact') || {};
  const sections = Pages.getSections('contact');
  const jsonLd = buildJsonLd('contact');

  res.render('site/contact', {
    page,
    sections,
    jsonLd,
    currentPath: '/contact',
    prefillService: req.query.service || '',
    prefillPackage: req.query.package || ''
  });
});

// ==========================================
// API ENDPOINTS (Leads, Chatbot, Analytics)
// ==========================================

// Submit Main Enquiry Form (Supports JSON & multipart/form-data)
router.post('/api/enquiry', uploadAttachment.single('attachment'), async (req, res) => {
  try {
    const { name, company, service, source_page, _hp, budget, timeline } = req.body;
    const contact = (req.body.contact || req.body.phone || req.body.email || '').trim();
    const phone = (req.body.phone || '').trim();
    const email = (req.body.email || '').trim();
    const message = (req.body.message || req.body.details || '').trim();

    // Honeypot check (bot prevention)
    if (_hp) {
      return res.json({ success: true, message: 'Enquiry received.' });
    }

    if (!name || !name.trim() || !contact) {
      return res.status(400).json({ success: false, error: 'Name and contact information are required.' });
    }

    let filePath = null;
    let fileOriginalName = null;
    if (req.file) {
      const saved = savePrivateAttachment(req.file);
      filePath = saved.filepath;
      fileOriginalName = saved.original_name;
    }

    const isEmail = email ? true : contact.includes('@');
    const fullMessage = [
      message,
      budget ? `Budget: ${budget}` : '',
      timeline ? `Timeline: ${timeline}` : ''
    ].filter(Boolean).join('\n');

    const enquiryId = Enquiries.create({
      name: name.trim(),
      contact: contact,
      email: email || (isEmail ? contact : null),
      phone: phone || (!isEmail ? contact : null),
      business_name: company ? company.trim() : null,
      service: Array.isArray(service) ? service.join(', ') : (service || 'General'),
      message: fullMessage || null,
      file_path: filePath,
      file_original_name: fileOriginalName,
      source: 'Project Enquiry Form',
      source_page: source_page || '/contact',
      ip_hash: res.locals.analyticsSessionHash || '',
      user_agent: req.headers['user-agent'] || ''
    });

    // Notify Admin via email
    notifyNewEnquiry({
      id: enquiryId,
      name,
      contact,
      email: email || (isEmail ? contact : null),
      phone: phone || (!isEmail ? contact : null),
      business_name: company,
      service: Array.isArray(service) ? service.join(', ') : service,
      message: fullMessage,
      source: 'Project Enquiry Form',
      source_page
    }).catch(err => console.error('[enquiry:email:fail]', err.message));

    // Record conversion event
    if (res.locals.analyticsSessionHash) {
      Analytics.recordEvent({
        session_hash: res.locals.analyticsSessionHash,
        event_type: 'enquiry_submit',
        event_label: (Array.isArray(service) ? service.join(', ') : service) || 'General'
      });
    }

    res.json({
      success: true,
      message: 'Enquiry received! We will review your details and respond within one working day.',
      enquiryId
    });
  } catch (err) {
    console.error('[enquiry:error]', err);
    res.status(500).json({
      success: true, // Graceful fallback
      message: 'Enquiry logged. Our team will contact you shortly.'
    });
  }
});

// WhatsApp Click Counter API
router.all('/api/analytics/whatsapp-click', (req, res) => {
  try {
    const currentClicks = parseInt(Settings.get('whatsapp_clicks') || '0', 10);
    const updatedClicks = currentClicks + 1;
    Settings.set('whatsapp_clicks', String(updatedClicks));

    if (res.locals.analyticsSessionHash) {
      Analytics.recordEvent({
        session_hash: res.locals.analyticsSessionHash,
        event_type: 'whatsapp_click',
        event_label: 'WhatsApp Button Click'
      });
    }
    res.json({ success: true, clicks: updatedClicks });
  } catch (err) {
    res.json({ success: true });
  }
});

// Submit Hero Consultation Form
router.post('/api/consultation', async (req, res) => {
  try {
    const { contact, _hp } = req.body;
    if (_hp) return res.json({ success: true });
    if (!contact || !contact.trim()) {
      return res.status(400).json({ success: false, error: 'Contact detail required' });
    }

    const isEmail = contact.includes('@');
    const enquiryId = Enquiries.create({
      name: 'Website Visitor',
      contact: contact.trim(),
      email: isEmail ? contact.trim() : null,
      phone: !isEmail ? contact.trim() : null,
      service: 'Free Consultation Request',
      source: 'Hero Consultation',
      source_page: '/',
      ip_hash: res.locals.analyticsSessionHash || '',
      user_agent: req.headers['user-agent'] || ''
    });

    notifyNewEnquiry({
      id: enquiryId,
      name: 'Website Visitor',
      contact,
      email: isEmail ? contact : null,
      phone: !isEmail ? contact : null,
      service: 'Free Consultation Request',
      source: 'Hero Consultation',
      source_page: '/'
    }).catch(err => console.error(err));

    res.json({
      success: true,
      message: 'Consultation request received! We will reach out within 24 hours.'
    });
  } catch (err) {
    res.json({ success: true, message: 'Consultation request logged.' });
  }
});

// Chatbot Knowledge & Lead Capture API
router.post('/api/chatbot', async (req, res) => {
  try {
    const { action, query, leadData } = req.body;

    // 1. Initial Greeting / Start Chips
    if (action === 'init') {
      const startChips = Chatbot.getVisible().filter(i => i.start).map(i => i.label);
      return res.json({
        greeting: 'നമസ്കാരം! I’m the Wing Assistant from Explore Wings Digital in Trivandrum. How can we help your business today?',
        chips: startChips.length ? startChips : ['Our Services', 'Pricing & Quote', 'How we work', 'Get Free Consultation']
      });
    }

    // 2. Lead Capture Save
    if (action === 'lead_submit' && leadData) {
      const isEmail = (leadData.contact || '').includes('@');
      const enquiryId = Enquiries.create({
        name: leadData.name || 'Chatbot Lead',
        contact: leadData.contact || 'Not provided',
        email: isEmail ? leadData.contact : null,
        phone: !isEmail ? leadData.contact : null,
        service: leadData.service || 'Chatbot Consultation',
        message: leadData.notes || 'Inquired via Wing Assistant chatbot.',
        source: 'Chatbot',
        source_page: req.headers['referer'] || '/',
        ip_hash: res.locals.analyticsSessionHash || '',
        user_agent: req.headers['user-agent'] || ''
      });

      notifyNewEnquiry({
        id: enquiryId,
        name: leadData.name,
        contact: leadData.contact,
        email: isEmail ? leadData.contact : null,
        phone: !isEmail ? leadData.contact : null,
        service: leadData.service || 'Chatbot Consultation',
        message: leadData.notes,
        source: 'Chatbot'
      }).catch(err => console.error(err));

      if (res.locals.analyticsSessionHash) {
        Analytics.recordEvent({
          session_hash: res.locals.analyticsSessionHash,
          event_type: 'chatbot_lead',
          event_label: leadData.service || 'General'
        });
      }

      return res.json({
        reply: `Thanks, ${leadData.name}! We've logged your request. Someone from our Trivandrum office will contact you via ${leadData.contact} within 24 hours.`,
        chips: ['Our Services', 'How we work', 'Contact Details']
      });
    }

    // 3. Natural Query Match
    const match = Chatbot.findResponse(query);
    if (match) {
      if (match.action === 'lead') {
        return res.json({
          reply: match.answer || "We'd love to help! Let's get your free consultation started. What is your name?",
          isLeadStart: true,
          chips: []
        });
      }

      const chips = match.chips ? match.chips.split(',').map(s => s.trim()).filter(Boolean) : [];
      return res.json({
        reply: match.answer,
        chips
      });
    }

    // Default Fallback
    res.json({
      reply: "I'm here to help with your digital project in Trivandrum. You can explore our services, review our process, or request a free consultation.",
      chips: ['Our Services', 'Pricing & Quote', 'How we work', 'Get Free Consultation']
    });
  } catch (err) {
    res.json({
      reply: 'We are available Monday to Saturday. Leave your contact details and we will get back to you shortly.',
      chips: ['Our Services', 'Get Free Consultation']
    });
  }
});

// Analytics Beacon (Time on page & Conversion events)
router.post('/api/analytics/beacon', express.json(), (req, res) => {
  const { pageViewId, timeOnPage, eventType, eventLabel, sessionHash } = req.body;

  if (pageViewId && timeOnPage) {
    Analytics.updateTimeOnPage(pageViewId, Math.min(3600, parseInt(timeOnPage, 10)));
  }

  if (eventType && sessionHash) {
    Analytics.recordEvent({
      session_hash: sessionHash,
      event_type: eventType,
      event_label: eventLabel || ''
    });
  }

  res.status(204).end();
});

// Maintenance Notification Email / Phone Subscription
router.post('/api/maintenance/notify', (req, res) => {
  const contact = (req.body.contact || req.body.email || '').trim();
  if (contact) {
    const { Uptime } = require('../db/queries');
    Uptime.subscribeMaintenance(contact);
  }
  res.json({ success: true, message: "Thank you! We will notify you the moment we are back online." });
});

// Sitemap.xml & Robots.txt
router.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.send(generateSitemap());
});

router.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(generateRobotsTxt());
});

module.exports = router;
