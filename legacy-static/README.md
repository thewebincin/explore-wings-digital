# Explore Wings Digital Technologies &mdash; Marketing Website

An editorial, human-crafted marketing website for **Explore Wings Digital Technologies**, an independent digital agency based in **Thiruvananthapuram (Trivandrum), Kerala, India**.

Designed with confident typography, restrained color blocks, zero AI buzzwords or placeholders, and built entirely with vanilla HTML5, CSS3, and modern JavaScript.

---

## 1. Core Architecture & Pages

- **`index.html`**: The main landing page following the strict editorial structure:
  1. Top utility bar (Auto scroll with Speed selector, Green & Red theme swatches, Light & Dark mode switch)
  2. Sticky navbar with white logo chip and direct project CTA
  3. Hero section with hand-drawn SVG underline, consultation input cluster, and a real product browser mockup
  4. Static client brand logo row
  5. Numbered editorial services list (01 to 06) with hover-reveals and accordion details
  6. Infinite two-row logo scroller ("Brands that trust us")
  7. 4-step execution process (Listen, Create, Launch, Grow)
  8. Bold founder statement section on dark contrasting surface
  9. Local FAQ accordion
  10. Project enquiry form with live validation
  11. Mega footer with Malayalam greeting (`നമസ്കാരം`), personal founder note, and studio address
- **`services.html`**: Comprehensive breakdown of the 6 core services (Websites, Brand Identity, Social Media, Photography & Video, Performance Marketing, Local SEO) with deliverables, timelines, and target business profiles.
- **`pricing.html`**: Three clear project tiers (Essential, Signature [featured], and Growth) with detailed deliverables, comparison table, and quote requests.
- **`about.html`**: Authentic company narrative, promises, and "Proudly from Trivandrum" section highlighting Technopark, Kovalam, and city centre businesses.
- **`contact.html`**: Config-driven contact cards, studio location details, and interactive lead submission form.
- **`404.html`**: Friendly, on-brand error page with recovery navigation.
- **`style.css`**: Complete design system with dual themes (Red / Green), light / dark modes, strict typography, and responsive rules (320px to 4K).
- **`script.js`**: Core engine handling theme switching, circular wipes, native auto-scroll, minimal desktop cursor, preloader, and global config binding.
- **`chatbot.js`**: "Wing Assistant" lightweight lead-capture chatbot with instant quick-replies for services, process, and quotes.

---

## 2. Configuration & Contact Binding

All contact details across the website are controlled from one central `CONFIG` object at the top of `script.js`:

```javascript
const CONFIG = {
  phone: "+91 94460 12345",
  email: "hello@explorewings.com",
  whatsapp: "+919446012345",
  instagram: "https://instagram.com/explorewingsdigital",
  facebook: "https://facebook.com/explorewingsdigital",
  linkedin: "https://linkedin.com/company/explorewingsdigital",
  address: "Trivandrum, Kerala, India",
  hours: "Monday – Saturday: 9:00 AM – 6:30 PM IST",
  formEndpoint: "https://formspree.io/f/explorewings"
};
```

- Any empty string (`""`) automatically hides the corresponding DOM element and link across the entire site.
- WhatsApp click-to-chat links sanitize the number and open with a pre-filled greeting.
- Phone links format automatically as `tel:` URIs.

---

## 3. Verified Client Brands

The website features 6 verified Kerala client logos located in `assets/logos/`:
1. `Aadisaktthi Resorts & Spa` (Kovalam)
2. `Terrace by Makkawao`
3. `Elaf`
4. `Global Fitness`
5. `Edustudy International`
6. `Transorze`

*Note: Clicking a logo in the marquee or static row does not open popups or dead links.*

---

## 4. Theme System & Mode Switching

- **Green Theme** (Default): Primary `#00A36C`, Deep `#0B3D2E`, Tint `#ECFDF5`, Accent `#B7E34D`
- **Red Theme**: Primary `#E11D2E`, Deep `#7A0A14`, Tint `#FFF1F2`, Accent `#F6C744`
- **Light Mode**: Off-white background `#FBF9F4`
- **Dark Mode**: Deep navy background `#0B1020`
- Switches trigger an animated circular clip-path wipe originating from the clicked control. Preferences are safely saved in `localStorage` inside `try...catch` blocks.

---

## 5. Performance, Accessibility & SEO

- Zero external framework dependencies (Vanilla JS + CSS).
- Native browser scrolling with smooth auto-scroll option.
- Full keyboard focus support (`:focus-visible`), WCAG AA contrast compliance, ARIA attributes on all interactive components.
- Responsive from 320px smartphones up to ultra-wide displays.
- LocalBusiness Schema JSON-LD embedded on homepage for Trivandrum, Kerala.
