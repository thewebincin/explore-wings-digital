'use strict';
/**
 * Line icons (Lucide-style, 24x24, stroke based). Used for services and the admin.
 * Stored as inner SVG markup so templates can render <svg> with consistent attributes.
 */
const ICONS = {
  '': { label: 'No icon', svg: '' },
  globe: { label: 'Globe / website', svg: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' },
  monitor: { label: 'Monitor', svg: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>' },
  pen: { label: 'Pen / branding', svg: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>' },
  instagram: { label: 'Social media', svg: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>' },
  camera: { label: 'Camera / photo', svg: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>' },
  megaphone: { label: 'Megaphone / ads', svg: '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>' },
  map: { label: 'Map pin / local SEO', svg: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' },
  search: { label: 'Search', svg: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' },
  chart: { label: 'Chart', svg: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>' },
  video: { label: 'Video', svg: '<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>' },
  store: { label: 'Shop front', svg: '<path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>' },
  message: { label: 'Message', svg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' }
};

const ICON_OPTIONS = Object.entries(ICONS).map(([value, i]) => ({ value, label: i.label }));

function iconSvg(name, size = 20, cls = '') {
  const i = ICONS[name];
  if (!i || !i.svg) return '';
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${i.svg}</svg>`;
}

module.exports = { ICONS, ICON_OPTIONS, iconSvg };
