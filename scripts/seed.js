'use strict';
/**
 * Database Seeder for Explore Wings Digital Technologies.
 * Populates all current site content, settings, and the initial owner account.
 * Running npm run seed loads everything idempotently.
 */
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('../lib/config');
const { db, initSchema } = require('../db/index');
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
  Media
} = require('../db/queries');

async function seed() {
  console.log('[seed] Initializing database schema...');
  initSchema();

  // 1. Copy logo assets if needed
  const srcLogosDir = path.resolve(__dirname, '..', 'assets', 'logos');
  const targetUploads = config.uploadsDir;
  const targetImages = path.join(config.publicDir, 'images');

  if (fs.existsSync(srcLogosDir)) {
    const files = fs.readdirSync(srcLogosDir);
    for (const f of files) {
      if (f.match(/\.(png|jpg|jpeg|svg|webp)$/i)) {
        fs.copyFileSync(path.join(srcLogosDir, f), path.join(targetUploads, f));
      }
    }
  }

  // Copy main logo to images
  const mainLogo = path.resolve(__dirname, '..', 'assets', 'logo.png');
  const rootLogo = path.resolve(__dirname, '..', 'logo.png');
  if (fs.existsSync(mainLogo)) {
    fs.copyFileSync(mainLogo, path.join(targetImages, 'logo.png'));
  } else if (fs.existsSync(rootLogo)) {
    fs.copyFileSync(rootLogo, path.join(targetImages, 'logo.png'));
  }

  // 2. Initial Owner Account
  if (Users.count() === 0) {
    const email = config.adminEmail || 'owner@explorewings.com';
    const rawPass = config.adminPassword || 'ExploreWings@2026';
    const hash = await bcrypt.hash(rawPass, 12);
    Users.create({
      email,
      password_hash: hash,
      name: 'Explore Wings Admin',
      role: 'Owner'
    });
    console.log(`[seed] Created owner user: ${email} (Password: ${rawPass})`);
  }

  // 3. Settings & Branding
  const defaultSettings = {
    site_name: 'Explore Wings Digital Technologies',
    site_tagline: 'Digital Technologies in Trivandrum, Kerala',
    site_url: config.siteUrl,
    phone: '+91 94460 12345',
    email: 'hello@explorewings.com',
    whatsapp: '+919446012345',
    address: 'Trivandrum, Kerala, India',
    hours: 'Monday – Saturday: 9:00 AM – 6:30 PM IST',
    instagram: 'https://instagram.com/explorewingsdigital',
    facebook: 'https://facebook.com/explorewingsdigital',
    linkedin: 'https://linkedin.com/company/explorewingsdigital',
    google_business_url: 'https://maps.google.com/?q=Explore+Wings+Digital+Technologies+Trivandrum',
    geo_latitude: '8.5241',
    geo_longitude: '76.9366',
    default_theme: 'green',
    default_mode: 'light',
    logo_path: '/images/logo.png',
    favicon_path: '/images/logo.png',
    og_default_image: '/images/logo.png',
    maintenance_mode: 'off', // 'off', 'on', 'scheduled'
    maintenance_message: "We're currently performing a scheduled update to our systems. We'll be back shortly.",
    maintenance_return_time: '',
    maintenance_allow_notify: '1',
    notification_email: config.adminEmail || 'hello@explorewings.com',
    auto_reply_enabled: '1',
    uptime_alert_email: config.adminEmail || 'hello@explorewings.com',
    analytics_retention_months: '24',
    ga4_id: config.ga4Id || '',
    gsc_verification_tag: ''
  };

  for (const [k, v] of Object.entries(defaultSettings)) {
    if (!Settings.get(k)) {
      Settings.set(k, v);
    }
  }

  // 4. Pages & Sections
  const pagesData = [
    {
      slug: 'home',
      title: 'Home',
      meta_title: 'Explore Wings Digital Technologies | Digital Agency in Trivandrum, Kerala',
      meta_description: 'We build custom websites, design brand identities, manage social media, shoot video, and drive local search rankings for businesses in Trivandrum and Kerala.',
      focus_keyword: 'Digital agency in Trivandrum',
      sections: {
        hero: {
          title: 'Websites & digital branding that bring real enquiries to your business.',
          subtitle: 'We work directly with founders, resorts, clinics, and local stores in Trivandrum to fix slow websites, shoot authentic media, and get found on Google.',
          button_text: 'Get free consultation',
          extra: {
            badge: 'Made in Trivandrum',
            note: 'Direct collaboration with founders',
            caption: 'No sales pressure. We will review your current online setup and reply within 24 hours.'
          }
        },
        bold_statement: {
          title: 'Direct Collaboration • Trivandrum Based',
          body: 'Most agencies sell confusing retainer packages and hide behind account managers. We build clean websites, shoot crisp local media, and answer your phone calls directly.',
          extra: {
            founder_note: 'From the desk of the founder • Explore Wings Digital Technologies, Trivandrum'
          }
        },
        process_intro: {
          title: 'Four simple steps from first call to live site.',
          subtitle: 'Our Process'
        },
        faq_intro: {
          title: 'Questions local business owners ask us.',
          subtitle: 'Honest answers without jargon. If your question is not listed here, send us an email or message on WhatsApp.'
        },
        enquiry: {
          title: 'Tell us about your project.',
          subtitle: 'Fill in the details below. We will review your current online presence and schedule a direct consultation.'
        }
      }
    },
    {
      slug: 'services',
      title: 'Our Services',
      meta_title: 'Services | Explore Wings Digital Technologies Trivandrum',
      meta_description: 'Explore our 6 core digital services: custom websites, brand identity, social media management, commercial photography, performance marketing, and local SEO in Kerala.',
      focus_keyword: 'Web development Trivandrum',
      sections: {
        header: {
          title: 'Practical digital services for growing businesses.',
          subtitle: 'No jargon, no bloated retainers. Just reliable design, development, and marketing executed directly by experienced practitioners in Trivandrum.'
        }
      }
    },
    {
      slug: 'pricing',
      title: 'Pricing & Packages',
      meta_title: 'Pricing & Packages | Explore Wings Digital Technologies',
      meta_description: 'Transparent, predictable project packages for websites, branding, and digital marketing in Trivandrum, Kerala. Clear deliverables and fixed timelines.',
      focus_keyword: 'Website pricing Kerala',
      sections: {
        header: {
          title: 'Clear packages. No surprise invoices.',
          subtitle: 'Every project is scoped with a defined list of deliverables, an agreed timeline, and direct access to your developer.'
        }
      }
    },
    {
      slug: 'about',
      title: 'About Us',
      meta_title: 'About Us | Explore Wings Digital Technologies Trivandrum',
      meta_description: 'Learn about Explore Wings Digital Technologies, an independent digital company founded in Trivandrum, Kerala. Direct collaboration, reliable websites, and honest digital marketing.',
      focus_keyword: 'About Explore Wings Trivandrum',
      sections: {
        header: {
          title: 'Direct digital work from Trivandrum.',
          subtitle: 'We are an independent digital agency built on a simple belief: local business owners deserve clear communication, honest timelines, and real results without agency hype.'
        },
        story: {
          title: 'Why we started Explore Wings Digital Technologies',
          body: 'For years, business owners across Kerala faced an uncomfortable choice: hire large tech agencies that charge exorbitant fees and pass client accounts down to inexperienced interns, or hire unvetted freelancers who disappear halfway through a project.\n\nExplore Wings Digital Technologies was founded in Trivandrum to offer a direct alternative. When you work with us, you speak directly with the people building your code, designing your identity, and running your ads.\n\nWe understand the local Kerala market intimately. We know the rhythm of tourist seasons in Kovalam and Varkala, the commercial activity around Technopark and Kazhakkoottam, and how shoppers in Kowdiar and East Fort discover services on their phones.'
        },
        founder_quote: {
          body: 'When I started Explore Wings, my pledge was simple: never use canned marketing buzzwords, never invent fake numbers or testimonials, and never leave a client wondering what they paid for. Every website we build must load fast on an ordinary mobile connection, and every rupee spent on marketing must be accounted for.'
        }
      }
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      meta_title: 'Contact Us | Explore Wings Digital Technologies Trivandrum',
      meta_description: 'Get in touch with Explore Wings Digital Technologies in Trivandrum, Kerala. Request a free project consultation, call us directly, or send an enquiry.',
      focus_keyword: 'Contact Explore Wings Trivandrum',
      sections: {
        header: {
          title: "Let's talk about your business goals.",
          subtitle: "Whether you need a new website, a local brand overhaul, or more inquiries through Google, we're ready to listen and give you honest advice."
        }
      }
    }
  ];

  for (const p of pagesData) {
    Pages.save(p.slug, {
      title: p.title,
      meta_title: p.meta_title,
      meta_description: p.meta_description,
      focus_keyword: p.focus_keyword
    });
    if (p.sections) {
      for (const [secKey, secVal] of Object.entries(p.sections)) {
        Pages.saveSection(p.slug, secKey, secVal);
      }
    }
  }

  // 5. Seed Services (if table empty or reset)
  if (Services.getAll().length === 0) {
    const servicesSeed = [
      {
        slug: 'websites',
        title: 'Custom Websites & Web Apps',
        short_desc: 'High-speed websites built specifically for your business, loading in under 2 seconds.',
        teaser: 'We write clean code without bloated templates. Every page is tailored for mobile visitors in Kerala, with quick WhatsApp enquiry buttons and clear navigation.',
        full_desc: 'We build clean, fast-loading websites that look sharp on mobile screens and convert visitors into WhatsApp messages or calls. Whether you run a beachfront resort in Kovalam, a dental clinic in Kowdiar, or a training institute, we ensure your site represents your real-world reputation.',
        included: 'Mobile-first responsive architecture\nSub-2-second load times\nDirect WhatsApp & phone integration\nSSL certificate & secure setup\nDomain & hosting configuration\nContent management training for your staff',
        best_for: 'Hotels, resorts, healthcare clinics, educational consultancies, fitness centres, and service firms seeking a credible web presence.',
        delivery_note: 'Typical delivery: 2 to 3 weeks',
        cta_text: 'Enquire about websites',
        icon: 'globe'
      },
      {
        slug: 'branding',
        title: 'Brand Identity & Logo Design',
        short_desc: 'Memorable logos, color systems, and signage specs ready for local print shops.',
        teaser: 'A brand is more than just a symbol. We design vector assets that work clearly on road signboards in Kowdiar as well as on Instagram profile icons.',
        full_desc: 'Your logo needs to work on a 20-foot outdoor signboard along the MG Road just as effectively as on a smartphone screen. We craft clean vector identities, typography pairings in English and Malayalam, and comprehensive brand manuals you can share with signage manufacturers and printers.',
        included: 'Primary, secondary & mark variations\nBilingual typography selection\nPrint-ready vector assets (SVG, EPS, PDF)\nSignboard & uniform mockups\nColor hierarchy specifications (CMYK & RGB)\nBrand guideline documentation',
        best_for: 'New businesses launching in Kerala, or established stores and companies looking to modernise their visual presentation.',
        delivery_note: 'Typical delivery: 10 to 14 days',
        cta_text: 'Enquire about branding',
        icon: 'pen'
      },
      {
        slug: 'social',
        title: 'Social Media Management',
        short_desc: 'Thoughtful Instagram and Facebook management with real photography and clear captions.',
        teaser: 'No generic downloaded templates. We create content that shows your actual products, customer experiences, and daily behind-the-scenes.',
        full_desc: "Social media for local businesses shouldn't feel like a factory of generic quotes. We post authentic updates, real photography of your staff and products, short informative reels, and daily updates that keep your brand familiar to customers in Trivandrum and surrounding districts.",
        included: 'Monthly scheduled content calendar\nReels and short video production\nAuthentic local engagement\nCommunity reply management\nClear Malayalam & English caption writing\nTransparent monthly analytics report',
        best_for: 'Cafes, gyms, specialty retail stores, ayurvedic resorts, and training academies needing reliable monthly content.',
        delivery_note: 'Engagement: Monthly retainer',
        cta_text: 'Enquire about social media',
        icon: 'instagram'
      },
      {
        slug: 'photo',
        title: 'Photography & Commercial Video',
        short_desc: 'On-location shoots in Trivandrum, Kovalam, and across Kerala for your spaces and products.',
        teaser: 'Stock photos ruin trust. We bring proper lighting and camera gear to your restaurant, clinic, resort, or gym to capture real images that sell.',
        full_desc: 'Nothing undermines credibility faster than generic stock photos of corporate actors. We provide on-location shoots across South Kerala with cinema-grade cameras, proper lighting, and clean audio to capture your actual venue, products, and customer interactions.',
        included: 'High-resolution architectural & interior photos\nProduct & menu item photography\nShort vertical videos for Instagram Reels\nProfessional color grading\nDelivery in web & print formats\nFull commercial licensing rights',
        best_for: 'Resorts in Kovalam/Varkala, rooftop restaurants, fitness studios, fashion boutiques, and medical facilities.',
        delivery_note: 'Format: Half-day or full-day shoot',
        cta_text: 'Enquire about photography',
        icon: 'camera'
      },
      {
        slug: 'marketing',
        title: 'Performance Digital Marketing',
        short_desc: 'Targeted Meta and Google Ads campaigns tracked directly to phone calls and form submissions.',
        teaser: 'We do not celebrate vanity metrics. We configure conversion tracking so you know exactly which ad brought in a customer enquiry.',
        full_desc: 'Spend ad budgets where they actually produce phone calls, clinic appointments, or resort bookings. We set up tightly-targeted Meta (Instagram/Facebook) and Google Ads campaigns, ensuring every rupee is tracked against verified customer inquiries.',
        included: 'Google Search & Local Service Ads\nInstagram & Facebook lead generation\nGeographic radius targeting\nWhatsApp click-to-chat ad setup\nWeekly budget optimisation\nLead quality reviews',
        best_for: 'Businesses with an active sales cycle looking for a steady flow of direct customer inquiries.',
        delivery_note: 'Flexible ad budget management',
        cta_text: 'Enquire about marketing',
        icon: 'megaphone'
      },
      {
        slug: 'localseo',
        title: 'Google Search & Local SEO',
        short_desc: 'Show up on Google Maps and search results when people look for services in Trivandrum.',
        teaser: 'Local customers use Google Maps before visiting. We fix your profile details, category placement, citations, and review strategy.',
        full_desc: 'When people search for "best physiotherapist in Trivandrum" or "rooftop cafe near Kowdiar", your business must appear prominently on Google Maps and search results. We optimize your business profile, fix citations, and build a systematic plan to gather real customer reviews.',
        included: 'Google Business Profile verification & setup\nLocal citation & NAP consistency check\nMap ranking keyword strategy\nReview collection system for staff\nOn-page SEO tags & schema markup\nMonthly ranking progression report',
        best_for: 'Brick-and-mortar stores, clinics, dental practices, fitness gyms, car workshops, and restaurants.',
        delivery_note: 'Timeline: Visible results in 4 to 8 weeks',
        cta_text: 'Enquire about local SEO',
        icon: 'map'
      }
    ];

    for (const s of servicesSeed) {
      Services.create(s);
    }
    console.log(`[seed] Created ${servicesSeed.length} core services.`);
  }

  // 6. Seed Brands (if table empty)
  if (Brands.getAll().length === 0) {
    const brandsSeed = [
      { name: 'Aadisaktthi Resorts & Spa', logo: '/uploads/aadisaktthi-resorts-spa.png', url: '' },
      { name: 'Terrace by Makkawao', logo: '/uploads/terrace-by-makkawao.png', url: '' },
      { name: 'Elaf', logo: '/uploads/elaf.png', url: '' },
      { name: 'Global Fitness', logo: '/uploads/global-fitness.png', url: '' },
      { name: 'Edustudy International', logo: '/uploads/edustudy-international.png', url: '' },
      { name: 'Transorze', logo: '/uploads/transorze.png', url: '' }
    ];

    for (const b of brandsSeed) {
      Brands.create(b);
    }
    console.log(`[seed] Created ${brandsSeed.length} client brands.`);
  }

  // 7. Seed FAQs (if table empty)
  if (FAQs.getAll().length === 0) {
    const faqsSeed = [
      {
        question: 'Do you work only with businesses inside Trivandrum?',
        answer: 'Our studio is located in Trivandrum, but we work with clients across Kerala (Kollam, Kochi, Calicut) and overseas businesses run by Malayali founders in the GCC, UK, and Australia. For local businesses, we meet you in person; for remote clients, we run clear weekly video updates.'
      },
      {
        question: 'How long does it take to complete a new website?',
        answer: 'A standard 5-to-8 page business website usually takes between 2 to 3 weeks once we receive your text and brand assets. Larger web applications or custom catalog sites typically take 4 to 6 weeks. We agree on a fixed launch date before starting.'
      },
      {
        question: 'Who owns the website and code after launch?',
        answer: 'You do. 100%. All source code, domain registrations, hosting accounts, and image assets belong entirely to your company. We never lock you into proprietary platforms or hold your domain hostage.'
      },
      {
        question: 'Can you fix or redesign our existing outdated website?',
        answer: "Yes. If your current website is slow, doesn't open properly on mobile screens, or lacks an SSL security certificate, we can rebuild it from the ground up while keeping your existing domain name and search engine rankings intact."
      },
      {
        question: 'How are project payments structured?',
        answer: 'We work with milestone-based payments: typically 50% advance to initiate design and development, and the remaining 50% upon final testing, client sign-off, and deployment. No hidden recurring fees unless you opt for a monthly management retainer.'
      }
    ];

    for (const f of faqsSeed) {
      FAQs.create(f);
    }
    console.log(`[seed] Created ${faqsSeed.length} FAQs.`);
  }

  // 8. Seed Pricing Plans & Comparison Rows (if table empty)
  if (Plans.getAll().length === 0) {
    Plans.create({
      name: 'Essential',
      description: 'For single-location businesses needing a fast, professional digital presence.',
      delivery: '10 – 14 days',
      features: 'Custom 4-page responsive website\nSub-2-second load speed\nWhatsApp and phone click-to-contact\nGoogle Business Profile verification\nBasic on-page SEO setup\n30 days post-launch support',
      highlighted: 0,
      badge: '',
      button_text: 'Get a quote',
      button_link: 'contact.html?package=essential'
    });

    Plans.create({
      name: 'Signature',
      description: 'Complete digital overhaul for established businesses ready to increase customer inquiries.',
      delivery: '2 – 3 weeks',
      features: "Custom 8-page website with clean CMS\nLogo redesign & brand guidelines\nHalf-day commercial photoshoot in Kerala\nGoogle Maps & local SEO optimization\nSocial media template pack for Canva/Photoshop\n60 days post-launch support",
      highlighted: 1,
      badge: 'Most Popular in Kerala',
      button_text: 'Get a quote',
      button_link: 'contact.html?package=signature'
    });

    Plans.create({
      name: 'Growth',
      description: 'For multi-location brands, resorts, and firms needing hands-on marketing execution.',
      delivery: '4 weeks + monthly execution',
      features: 'Custom multi-page web application or booking flow\nFull-day photography & 4k video production\nComplete brand identity manual & signage specs\nActive Meta & Google Ads campaign management\nOngoing social media content production\nDedicated priority support with 4-hour SLA',
      highlighted: 0,
      badge: '',
      button_text: 'Get a quote',
      button_link: 'contact.html?package=growth'
    });

    // Comparison rows
    const rowsSeed = [
      { feature: 'Custom Responsive Pages', cells: 'Up to 4 pages\nUp to 8 pages\n12+ pages or custom app' },
      { feature: 'Page Load Performance', cells: 'Sub-2 seconds\nSub-1.5 seconds\nSub-1 second optimized' },
      { feature: 'Brand Identity & Logo', cells: 'Cleanup & vectorization\nFull logo design + guidelines\nComplete identity system' },
      { feature: 'On-Location Photography', cells: 'Optional add-on\nHalf-day Kerala shoot\nFull-day photo & 4k video' },
      { feature: 'Google Maps & Local SEO', cells: 'Verification & citations\nFull profile & ranking audit\nOngoing local ranking strategy' },
      { feature: 'Ad Campaign Management', cells: '—\nInitial campaign setup\nFull monthly management' },
      { feature: 'Post-Launch Support', cells: '30 days included\n60 days included\nOngoing monthly retainer' }
    ];

    for (const r of rowsSeed) {
      Plans.createRow(r);
    }
    console.log('[seed] Created pricing plans & comparison matrix.');
  }

  // 9. Seed Chatbot Intents
  if (Chatbot.getAll().length === 0) {
    const chatbotSeed = [
      {
        label: 'Our Services',
        keywords: 'service, services, what do you do, offerings, work',
        action: 'answer',
        answer: 'We provide six core services for businesses in Kerala and beyond:\n\n1. Custom Websites & Web Apps (fast, clean, mobile-first)\n2. Brand Identity & Logo Design (signboards, packaging, style guides)\n3. Social Media Management (reels, posts, content calendar)\n4. Photography & Commercial Video (on-location in Kerala)\n5. Performance Digital Marketing (Meta & Google ads, real leads)\n6. Google Search & Local SEO (Google Maps & local search ranking)',
        chips: 'Websites, Branding, Social Media, Local SEO, Pricing & Quote',
        start: 1
      },
      {
        label: 'Websites',
        keywords: 'web, website, site, app, redesign, speed',
        action: 'answer',
        answer: 'We build custom websites that load in under 2 seconds, look sharp on every phone screen, and turn visitors into enquiries. No clunky bloated page builders. Everything is hand-coded or built on reliable platforms depending on your business model.',
        chips: 'Pricing & Quote, How we work, Back to Services',
        start: 0
      },
      {
        label: 'Branding',
        keywords: 'brand, branding, logo, signboard, identity',
        action: 'answer',
        answer: 'We create distinct brand identities: primary and secondary logos, Malayalam & English typography pairing, color palettes, print-ready vector files, shop signboard specs, and brand guidelines you can hand to any printer in Trivandrum.',
        chips: 'Pricing & Quote, Websites, Back to Services',
        start: 0
      },
      {
        label: 'Social Media',
        keywords: 'social, instagram, facebook, reel, reels, post',
        action: 'answer',
        answer: 'Consistent, thoughtful content for Instagram, Facebook, and LinkedIn. We plan monthly calendars, shoot real photos/reels, write straightforward captions, and engage with your local community. No generic Canva templates.',
        chips: 'Photography & Video, Digital Marketing, Back to Services',
        start: 0
      },
      {
        label: 'Photography & Video',
        keywords: 'photo, photography, video, shoot, camera, photoshoot',
        action: 'answer',
        answer: 'Real imagery for real businesses. We bring cameras, lighting, and audio directly to your venue in Trivandrum, Kovalam, Varkala, or Kochi. Perfect for restaurant dishes, resort interiors, gym workouts, or product catalogs.',
        chips: 'Social Media, Websites, Back to Services',
        start: 0
      },
      {
        label: 'Digital Marketing',
        keywords: 'marketing, ads, google ad, meta, instagram ad, leads',
        action: 'answer',
        answer: 'Targeted advertising across Meta (Instagram/Facebook) and Google Ads. We focus strictly on genuine inquiries, store visits, and bookings rather than meaningless vanity impressions.',
        chips: 'Pricing & Quote, Local SEO, Back to Services',
        start: 0
      },
      {
        label: 'Local SEO',
        keywords: 'seo, google map, maps, ranking, local search, review',
        action: 'answer',
        answer: 'When someone in Trivandrum searches for what you offer, you need to show up on Google Maps and top search results. We optimize your Google Business profile, citations, keywords, and local review strategy.',
        chips: 'Websites, Pricing & Quote, Back to Services',
        start: 0
      },
      {
        label: 'How we work',
        keywords: 'process, how, steps, workflow, listen, create, launch, grow',
        action: 'answer',
        answer: 'Our process is clear and predictable:\n\n• Step 1: Listen — We sit down with you (in person in Trivandrum or on a call) to understand your real business goals.\n• Step 2: Create — We design and build the work with weekly check-ins.\n• Step 3: Launch — Thorough testing on devices before going live.\n• Step 4: Grow — Ongoing support, SEO monitoring, and updates.',
        chips: 'Pricing & Quote, Get Free Consultation, Our Services',
        start: 1
      },
      {
        label: 'Pricing & Quote',
        keywords: 'price, pricing, quote, cost, package, rates, budget',
        action: 'answer',
        answer: 'We offer transparent project packages:\n\n• Essential — For single-location businesses needing a quick, polished launch.\n• Signature — Our most popular complete package (website + brand refresh + Google Maps).\n• Growth — Complete digital presence with content creation and ongoing ads.\n\nEvery project gets a fixed written quote with no surprise fees.',
        chips: 'Get Free Consultation, Contact Details, Our Services',
        start: 1
      },
      {
        label: 'Contact Details',
        keywords: 'contact, address, phone, email, location, office, where, hours',
        action: 'answer',
        answer: 'We are based right here in Trivandrum, Kerala.\n\n• Location: Trivandrum, Kerala, India\n• Hours: Monday to Saturday, 9:00 AM – 6:30 PM IST\n• Email: hello@explorewings.com\n• Phone: +91 94460 12345\n\nYou can also leave your contact information right here, and we will get back to you within 24 hours.',
        chips: 'Get Free Consultation, Our Services, How we work',
        start: 0
      },
      {
        label: 'Get Free Consultation',
        keywords: 'consult, consultation, free consultation, hire, start, project, quote request',
        action: 'lead',
        answer: "We'd love to help! Let's get your free consultation started.",
        chips: '',
        start: 1
      }
    ];

    for (const c of chatbotSeed) {
      Chatbot.create(c);
    }
    console.log(`[seed] Created ${chatbotSeed.length} chatbot reply intents.`);
  }

  // 10. Seed Navigation Items
  if (Nav.getAll().length === 0) {
    const navSeed = [
      { area: 'header', label: 'Home', url: '/' },
      { area: 'header', label: 'Services', url: '/services' },
      { area: 'header', label: 'Pricing', url: '/pricing' },
      { area: 'header', label: 'About', url: '/about' },
      { area: 'header', label: 'Contact', url: '/contact' },

      { area: 'footer_nav', label: 'Home', url: '/' },
      { area: 'footer_nav', label: 'Our Services', url: '/services' },
      { area: 'footer_nav', label: 'Pricing & Packages', url: '/pricing' },
      { area: 'footer_nav', label: 'About Explore Wings', url: '/about' },
      { area: 'footer_nav', label: 'Contact Us', url: '/contact' },

      { area: 'footer_services', label: 'Websites & Web Apps', url: '/services#websites' },
      { area: 'footer_services', label: 'Brand Identity & Logo', url: '/services#branding' },
      { area: 'footer_services', label: 'Social Media Management', url: '/services#social' },
      { area: 'footer_services', label: 'Commercial Photography', url: '/services#photo' },
      { area: 'footer_services', label: 'Digital Marketing', url: '/services#marketing' },
      { area: 'footer_services', label: 'Google Maps & SEO', url: '/services#localseo' }
    ];

    for (const n of navSeed) {
      Nav.create(n);
    }
    console.log(`[seed] Created ${navSeed.length} navigation links.`);
  }

  console.log('[seed] Seeding completed successfully.');
}

if (require.main === module) {
  seed().catch(err => {
    console.error('[seed] Error:', err);
    process.exit(1);
  });
}

module.exports = { seed };
