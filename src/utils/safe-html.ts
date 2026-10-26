import sanitizeHtml from 'sanitize-html';

/**
 * HTML affiché nettoyé (audit sécurité 1.6, H1, 26/10/2026). Même liste que l'API (edoto-api/src/common/safe-html.ts)
 * et le site : tout le reste (script, style, img, iframe, attributs, on*, liens non https) est retiré, le texte est gardé.
 */
export const SAFE_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'a'],
  allowedAttributes: { a: ['href'] },
  allowedSchemes: ['https'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  transformTags: { b: 'strong', i: 'em' },
};

export function safeHtml(value?: string | null): string {
  return typeof value === 'string' ? sanitizeHtml(value, SAFE_HTML_OPTIONS) : '';
}

// Extrait des listes : coupé puis nettoyé (une balise coupée est refermée ou retirée par sanitize-html).
export function safeHtmlExcerpt(value: string | null | undefined, max: number): string {
  if (typeof value !== 'string') return '';
  return safeHtml(value.length < max ? value : value.substring(0, max) + '...');
}
