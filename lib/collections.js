'use strict';
/**
 * Editable collections (lists of items). Each one becomes its own SQL table:
 * id, sort_order, visible, created_at, updated_at + one column per field.
 * Admin list/edit screens are generated from these definitions.
 */
const { ICON_OPTIONS } = require('./icons');

const COLLECTIONS = {
  services: {
    table: 'services',
    label: 'Services',
    singular: 'service',
    perm: 'content',
    titleField: 'title',
    columns: ['title', 'delivery_note'],
    help: 'The six rows on the home page and the detailed blocks on the Services page. Drag to reorder.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 120 },
      { name: 'slug', label: 'Link anchor', type: 'text', max: 60, help: 'Used in links like /services#websites. Lowercase letters and dashes. Leave empty to create it from the title.' },
      { name: 'short_desc', label: 'Short description', type: 'textarea', max: 300, rows: 2, help: 'One sentence shown in the home page list.' },
      { name: 'teaser', label: 'Home page detail text', type: 'textarea', max: 700, rows: 3, help: 'Shown when a visitor opens the row on the home page.' },
      { name: 'full_desc', label: 'Full description (Services page)', type: 'richtext' },
      { name: 'included', label: "What's included", type: 'lines', help: 'One item per line. The home page shows the first four.' },
      { name: 'best_for', label: 'Best suited for', type: 'textarea', max: 400, rows: 2 },
      { name: 'delivery_note', label: 'Timeline note', type: 'text', max: 120, help: 'For example "Typical delivery: 2 to 3 weeks".' },
      { name: 'cta_text', label: 'Button text', type: 'text', max: 60 },
      { name: 'icon', label: 'Icon', type: 'select', options: ICON_OPTIONS, help: 'Optional. Shown under the number on the Services page.' },
      { name: 'image', label: 'Image', type: 'image', help: 'Optional. Shown in the side card on the Services page.' }
    ]
  },
  brands: {
    table: 'brands',
    label: 'Brands that trust us',
    singular: 'brand',
    perm: 'content',
    titleField: 'name',
    columns: ['name', 'url'],
    thumbField: 'logo',
    multipart: true,
    help: 'Logos in the static row and the two auto-scrolling rows. Changes show on the site straight away.',
    fields: [
      { name: 'name', label: 'Brand name', type: 'text', required: true, max: 100 },
      { name: 'logo', label: 'Logo', type: 'image', required: true, upload: true, help: 'PNG, JPG, SVG or WebP up to 5 MB. Raster images are converted to WebP automatically.' },
      { name: 'url', label: 'Website link (optional)', type: 'url', max: 300, help: 'If set, the logo in the static row links to this site. The scrolling rows are never clickable.' }
    ]
  },
  faqs: {
    table: 'faqs',
    label: 'FAQ',
    singular: 'question',
    perm: 'content',
    titleField: 'question',
    columns: ['question'],
    help: 'Questions on the home page. Also published as FAQPage schema for Google.',
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true, max: 200 },
      { name: 'answer', label: 'Answer', type: 'richtext', required: true }
    ]
  },
  plans: {
    table: 'plans',
    label: 'Pricing plans',
    singular: 'plan',
    perm: 'content',
    titleField: 'name',
    columns: ['name', 'delivery'],
    help: 'Plan cards on the Pricing page. No prices are shown; each plan links to a quote request.',
    fields: [
      { name: 'name', label: 'Plan name', type: 'text', required: true, max: 60 },
      { name: 'description', label: 'Description', type: 'textarea', max: 300, rows: 2 },
      { name: 'delivery', label: 'Delivery time', type: 'text', max: 80 },
      { name: 'features', label: "What's included", type: 'lines', help: 'One item per line.' },
      { name: 'highlighted', label: 'Highlight this plan', type: 'checkbox', checkLabel: 'Show as the highlighted plan' },
      { name: 'badge', label: 'Badge text (highlighted plan)', type: 'text', max: 40 },
      { name: 'button_text', label: 'Button text', type: 'text', max: 40 },
      { name: 'button_link', label: 'Button link', type: 'url', max: 200 }
    ]
  },
  pricing_rows: {
    table: 'pricing_rows',
    label: 'Pricing comparison rows',
    singular: 'row',
    perm: 'content',
    titleField: 'feature',
    columns: ['feature'],
    help: 'Rows of the comparison table on the Pricing page.',
    fields: [
      { name: 'feature', label: 'Feature', type: 'text', required: true, max: 120 },
      { name: 'cells', label: 'Values, one per plan', type: 'lines', help: 'One line per visible plan, in the same order as the plans. Use a dash (—) for "not included".' }
    ]
  },
  chatbot: {
    table: 'chatbot_intents',
    label: 'Chatbot replies',
    singular: 'reply',
    perm: 'content',
    titleField: 'label',
    columns: ['label', 'keywords', 'action'],
    help: 'Quick-reply buttons, the words that trigger them and the answer the assistant gives.',
    fields: [
      { name: 'label', label: 'Button text', type: 'text', required: true, max: 60 },
      { name: 'keywords', label: 'Keywords', type: 'text', max: 400, help: 'Comma separated. If a visitor types any of these, this answer is used.' },
      {
        name: 'action', label: 'What happens', type: 'select', options: [
          { value: 'answer', label: 'Show the answer' },
          { value: 'lead', label: 'Start the consultation (asks name, contact, project)' }
        ]
      },
      { name: 'answer', label: 'Answer', type: 'textarea', max: 1500, rows: 5, help: 'Plain text. You can use {address}, {hours}, {phone}, {email} and {whatsapp}; lines with an empty value are left out.' },
      { name: 'chips', label: 'Follow-up buttons', type: 'text', max: 300, help: 'Comma separated button texts shown after this answer.' },
      { name: 'start', label: 'Welcome button', type: 'checkbox', checkLabel: 'Show this button when the chat opens' }
    ]
  },
  nav: {
    table: 'nav_items',
    label: 'Menu and footer links',
    singular: 'link',
    perm: 'content',
    titleField: 'label',
    columns: ['label', 'area', 'url'],
    help: 'Top menu, mobile menu and footer link columns.',
    fields: [
      {
        name: 'area', label: 'Where', type: 'select', required: true, options: [
          { value: 'header', label: 'Top menu (and mobile menu)' },
          { value: 'footer_nav', label: 'Footer: Navigation column' },
          { value: 'footer_services', label: 'Footer: Services column' }
        ]
      },
      { name: 'label', label: 'Link text', type: 'text', required: true, max: 60 },
      { name: 'url', label: 'Link', type: 'url', required: true, max: 300 },
      { name: 'new_tab', label: 'Open in new tab', type: 'checkbox', checkLabel: 'Open in a new tab' }
    ]
  }
};

module.exports = { COLLECTIONS };
