'use strict';
/**
 * Small, dependency-light helpers for cleaning user input.
 * Every form value passes through one of these before it reaches the database.
 */
const sanitizeHtml = require('sanitize-html');

const RICH_OPTIONS = {
  allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'blockquote'],
  allowedAttributes: { a: ['href', 'target', 'rel', 'title'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    b: 'strong',
    i: 'em',
    div: 'p',
    h1: 'h2',
    a: (tagName, attribs) => {
      const out = { href: attribs.href || '#' };
      if (attribs.title) out.title = attribs.title;
      if (attribs.target === '_blank') {
        out.target = '_blank';
        out.rel = 'noopener noreferrer';
      }
      return { tagName: 'a', attribs: out };
    }
  },
  exclusiveFilter: (frame) => ['p', 'li', 'h2', 'h3', 'h4'].includes(frame.tag) && !frame.text.trim() && !frame.mediaChildren.length
};

function sanitizeRich(html, max = 20000) {
  const s = sanitizeHtml(String(html || ''), RICH_OPTIONS).trim();
  return s.length > max ? s.slice(0, max) : s;
}

/** Plain text: strips tags and control characters, collapses whitespace on one line. */
function cleanText(value, max = 500) {
  if (value == null) return '';
  let s = Array.isArray(value) ? value[value.length - 1] : value;
  s = String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > max ? s.slice(0, max) : s;
}

/** Multi-line plain text: keeps line breaks. */
function cleanMultiline(value, max = 5000) {
  if (value == null) return '';
  let s = Array.isArray(value) ? value[value.length - 1] : value;
  s = String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return s.length > max ? s.slice(0, max) : s;
}

function isEmail(s) {
  return typeof s === 'string' && s.length <= 160 && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i.test(s.trim());
}

/** Returns a phone string with only digits and a leading + or '' if it doesn't look like a phone number. */
function normalizePhone(s) {
  if (!s) return '';
  const raw = String(s).trim();
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  return (raw.startsWith('+') ? '+' : '') + digits;
}

/** Allows http(s), mailto, tel and site-relative links. Anything else becomes ''. */
function safeUrl(value, { allowRelative = true } = {}) {
  const s = cleanText(value, 500);
  if (!s) return '';
  if (allowRelative && (/^\/(?!\/)/.test(s) || s.startsWith('#'))) return s;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) {
    try {
      if (/^https?:/i.test(s)) new URL(s);
      return s;
    } catch (e) {
      return '';
    }
  }
  return '';
}

/** Only allow references to our own public files. */
function safeAssetPath(value) {
  const s = cleanText(value, 300);
  if (!s) return '';
  if (/^\/(uploads|images)\/[\w\-./]+$/.test(s) && !s.includes('..')) return s;
  return '';
}

function slugify(s, max = 60) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
}

function lastValue(v) {
  return Array.isArray(v) ? v[v.length - 1] : v;
}

/** For embedding JSON safely inside <script type="application/json"> or ld+json. */
function jsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function csvCell(v) {
  let s = v == null ? '' : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(headers, rows) {
  const lines = [headers.map(csvCell).join(',')];
  for (const r of rows) lines.push(r.map(csvCell).join(','));
  return '\uFEFF' + lines.join('\r\n');
}

module.exports = {
  sanitizeRich,
  cleanText,
  cleanMultiline,
  isEmail,
  normalizePhone,
  safeUrl,
  safeAssetPath,
  slugify,
  lastValue,
  jsonForScript,
  toCsv
};
