# Explore Wings Digital Technologies — Database-Driven Web Application & Admin Console

A complete, production-grade Node.js LTS web application with an embedded SQLite database (via `better-sqlite3`), server-side rendered EJS templates, first-party cookieless analytics, and a full administrative console for **Explore Wings Digital Technologies**, based in Trivandrum (Thiruvananthapuram), Kerala, India.

---

## 1. Tech Stack Overview

- **Runtime & Framework**: Node.js 22 LTS, Express 4
- **Database Layer**: SQLite 3 via `better-sqlite3` (WAL mode, pragmas enabled, single data layer in `db/queries.js`)
- **Templating**: EJS with automatic partial and layout nesting (`site/layout.ejs` & `admin/layout.ejs`)
- **Styling**: Vanilla CSS with CSS custom properties (`/public/css/style.css` and `/public/css/admin.css`)
- **Client Scripts**: Vanilla JS with zero bulky frameworks (`/public/js/script.js`, `/public/js/chatbot.js`, `/public/js/analytics.js`, `/public/js/admin.js`)
- **Image Optimization**: `sharp` (automatic WebP format conversion, responsive downscaling, EXIF autorotate)
- **Security**: `helmet` (strict CSP, HSTS, frameguard), `bcryptjs` (salted password hashing), `express-session`, CSRF protection, brute-force lockout, rate limiting
- **2FA**: Two-Factor Authentication via TOTP (`otplib`, `qrcode`) compatible with Google Authenticator and 1Password

---

## 2. Key Features

### Public Website
- **Exact Human-Crafted Brand Identity**: Preserves the gold "E" / blue "W" Explore Wings brand mark, dual red & green color themes, light & dark modes, 60fps native auto-scroll engine, circular wipe transitions, preloader, and back-to-top ring.
- **Dynamic Content from Database**: Home, Services, Pricing, About, Contact, dynamic header/footer navigation, pricing matrix, FAQ accordion, and 2-row infinite auto-scrolling brand logo tracks are all served dynamically from SQLite.
- **Zero Placeholders & Zero AI Cliches**: Honest, verified copy with specific local Trivandrum context (Technopark, Kazhakkoottam, Kovalam, Varkala, Kowdiar). Banned AI buzzwords strictly avoided.
- **Config-Driven Contact Details**: Studio phone, email, WhatsApp, address, hours, and social media links come from database settings. Any empty field is automatically hidden everywhere on the site without broken gaps.
- **Wing Assistant Chatbot**: Front-end widget talking asynchronously to `/api/chatbot`. Matches keywords from the database, provides quick-reply chips, and captures consultation leads.
- **First-Party Cookieless Analytics**: GDPR-compliant engagement tracker (< 1.5 KB) sending duration, scroll depth, and path beacons to `/api/analytics/beacon` using daily salted IP hashes.
- **SEO & Schema.org**: Fully automated JSON-LD schemas (`LocalBusiness`, `Organization`, `WebSite`, `Service`, `FAQPage`), dynamic `/sitemap.xml`, and `/robots.txt`.

### Secure Admin Console (`/admin`, login at `/admin/login`)
- **Dashboard**: Live visitor counts, weekly enquiries, conversion rate, top viewed pages, internal uptime health, quick action shortcuts.
- **Content Editor (`/admin/pages`)**: Section-by-section editing for all pages with live preview, rich text controls, HTML sanitization, and version history with one-click restore.
- **Collections Management**:
  - **Services (`/admin/services`)**: Reorder, add, edit, toggle visibility.
  - **Brands (`/admin/brands`)**: Upload client logos with automatic WebP conversion, drag to reorder.
  - **FAQs (`/admin/faqs`)**: Manage questions, answers, and Google FAQ schema.
  - **Pricing (`/admin/plans`)**: Configure pricing packages, deliverables, highlight badges, and the comparison matrix.
  - **Chatbot Intents (`/admin/chatbot`)**: Manage intents, trigger keywords, and answers with an interactive test sandbox.
  - **Navigation (`/admin/navigation`)**: Header menu, footer link columns, and studio contact channels.
  - **Media Library (`/admin/media`)**: Gallery of uploaded assets with mandatory alt-text and size optimization.
- **Enquiries Inbox (`/admin/enquiries`)**: Centralized lead management from forms and chatbot, with status pipelines (`new`, `contacted`, `in_progress`, `closed`), internal notes, and 1-click CSV export.
- **Privacy Analytics View (`/admin/analytics`)**: Visual breakdowns of pageviews, unique visitors, referrers, device distributions, and conversion funnels.
- **SEO Manager (`/admin/seo`)**: Automated SEO audit score, 301/302 URL redirect manager, and 404 error monitor with 1-click redirect creation.
- **Maintenance Mode (`/admin/maintenance`)**: 503 HTTP status with Retry-After header, estimated return countdown, custom notice, visitor notify-me collector, secret URL bypass token (`?bypass=...`), and internal 60-second pinger history.
- **Users & Security (`/admin/users`, `/admin/security/2fa`)**: Role-Based Access Control (`Owner`, `Editor`, `Viewer`), bcrypt passwords, login lockout (5 failed attempts = 15 min lock), and TOTP Two-Factor Authentication.
- **Backups & Settings (`/admin/backups`, `/admin/settings`)**: Lock-free online SQLite snapshots, 14-day rotation, download/restore, and SMTP configuration with live test email.

---

## 3. Directory Structure

```
explore-wing-digital/
├── .env.example              # Environment variables template
├── .env                      # Local configuration
├── package.json              # Project dependencies and npm scripts
├── server.js                 # Express server bootstrap & middleware pipeline
├── Dockerfile                # Multi-stage production container
├── ecosystem.config.js       # PM2 process configuration
├── admin/
│   └── routes/
│       └── admin.js          # Admin console controller & API routes
├── data/
│   ├── site.db               # SQLite database file (WAL mode)
│   └── backups/              # Automated & manual snapshot archive
├── db/
│   ├── index.js              # SQLite connection, pragmas, table schema
│   └── queries.js            # Single data layer for all database operations
├── lib/
│   ├── backup.js             # Lock-free backup, prune, and restore logic
│   ├── config.js             # Environment configuration parser
│   ├── email.js              # Nodemailer transport & email notifications
│   ├── icons.js              # Inline SVG icon dictionary
│   ├── sanitize.js           # Safe HTML sanitizer and string cleaners
│   ├── seo.js                # Schema.org JSON-LD, sitemap, robots, SEO audit
│   ├── uploader.js           # Multer + Sharp WebP optimization
│   └── uptime.js             # Autonomous 60-second internal uptime pinger
├── middleware/
│   ├── analytics.js          # First-party cookieless analytics middleware
│   ├── auth.js               # Session auth, RBAC, CSRF, and login rate limiting
│   └── maintenance.js        # 503 maintenance mode interceptor
├── public/
│   ├── css/
│   │   ├── admin.css         # Admin console stylesheet
│   │   └── style.css         # Public website stylesheet
│   ├── fonts/                # Self-hosted Inter & Space Grotesk woff2 fonts
│   ├── images/               # Brand logos and icons
│   ├── js/
│   │   ├── admin.js          # Admin dashboard client script
│   │   ├── analytics.js      # Cookieless engagement tracker beacon (< 1.5 KB)
│   │   ├── chatbot.js        # Wing Assistant async client widget
│   │   └── script.js         # Public website engine (themes, scroll, forms)
│   └── uploads/              # Uploaded brand logos and media assets
├── routes/
│   └── site.js               # Public website page routes & public API endpoints
├── scripts/
│   ├── backup.js             # Standalone CLI backup runner
│   ├── reset-password.js     # Emergency CLI password reset tool
│   ├── seed.js               # Initial database seeder
│   └── smoke-test.js         # Automated end-to-end smoke test suite
└── views/
    ├── admin/                # Admin EJS templates
    │   ├── partials/nav.ejs
    │   ├── layout.ejs
    │   ├── login.ejs
    │   ├── dashboard.ejs
    │   ├── content-pages.ejs
    │   ├── content-edit.ejs
    │   ├── services-list.ejs
    │   ├── brands-list.ejs
    │   ├── faqs-list.ejs
    │   ├── plans-list.ejs
    │   ├── chatbot-list.ejs
    │   ├── navigation-list.ejs
    │   ├── media-list.ejs
    │   ├── enquiries-list.ejs
    │   ├── enquiry-detail.ejs
    │   ├── analytics-view.ejs
    │   ├── seo-manager.ejs
    │   ├── maintenance-view.ejs
    │   ├── users-list.ejs
    │   ├── security-2fa.ejs
    │   ├── settings-view.ejs
    │   ├── backups-view.ejs
    │   ├── logs-view.ejs
    │   └── error.ejs
    └── site/                 # Public website EJS templates
        ├── partials/
        │   ├── topbar.ejs
        │   ├── header.ejs
        │   ├── footer.ejs
        │   └── chatbot.ejs
        ├── layout.ejs
        ├── index.ejs
        ├── services.ejs
        ├── pricing.ejs
        ├── about.ejs
        ├── contact.ejs
        ├── maintenance.ejs
        ├── 404.ejs
        └── 500.ejs
```

---

## 4. Setup & Running Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Seed the Database
Populate SQLite with all services, brands, FAQs, pricing plans, chatbot intents, and the initial administrator account:
```bash
npm run seed
```

### Step 3: Start the Server
```bash
npm start
```
The server will start at `http://localhost:3000`.

- **Public Website**: `http://localhost:3000`
- **Admin Console**: `http://localhost:3000/admin`
- **Admin Login**: `http://localhost:3000/admin/login`
  - **Email**: `admin@explorewings.com`
  - **Password**: `AdminExploreWings2026!`

---

## 5. Verification & Testing

Run the automated smoke test suite:
```bash
npm test
```
The test suite verifies:
1. SQLite connection and data layer queries across all collections
2. HTTP 200 responses on all public pages (`/`, `/services`, `/pricing`, `/about`, `/contact`)
3. Dynamic XML sitemap (`/sitemap.xml`) and `/robots.txt`
4. Automatic 301 redirection of legacy `.html` routes
5. Custom 404 error page handling
6. Admin authentication endpoint
7. Asynchronous consultation and contact enquiry lead capture
8. Chatbot intent matching API (`/api/chatbot`)
9. First-party privacy analytics beacon (`/api/analytics/beacon`)

---

## 6. Production Deployment

### Using PM2
```bash
pm2 start ecosystem.config.js --env production
```

### Using Docker
```bash
docker build -t explore-wings .
docker run -p 3000:3000 -v $(pwd)/data:/app/data explore-wings
```

### Emergency CLI Tools
- **Reset Admin Password**:
  ```bash
  node scripts/reset-password.js admin@explorewings.com StrongSecurePass123!
  ```
- **Run Manual Backup**:
  ```bash
  node scripts/backup.js
  ```
