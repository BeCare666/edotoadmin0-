// Police du site et de l'admin choisie par le super admin (07/10/2026).
// Mêmes clés et mêmes réglages que le site (edoto/lib/siteFont.js) et l'API (site-appearance).
// Lisibilité : font-size-adjust = 0.548 (hauteur des minuscules de Poppins, mesurée dans le fichier
// officiel) → toutes les polices s'affichent à la même taille visuelle que Poppins.

const GF = 'https://fonts.googleapis.com/css2?family=';
const SANS = 'Arial, sans-serif';
export const POPPINS_ASPECT = '0.548';
export const FONT_STORAGE_KEY = 'edoto_site_font';

export type SiteFont = { key: string; label: string; style: string; stack: string; href: string | null };

export const SITE_FONTS: SiteFont[] = [
  { key: 'poppins', label: 'Poppins', style: 'Ronde, moderne (police actuelle)', stack: `'Poppins', ${SANS}`, href: null },
  { key: 'inter', label: 'Inter', style: 'La plus lisible pour les petits textes et les tableaux', stack: `'Inter', ${SANS}`, href: `${GF}Inter:wght@400;500;600;700&display=swap` },
  { key: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', style: 'Moderne, haut de gamme', stack: `'Plus Jakarta Sans', ${SANS}`, href: `${GF}Plus+Jakarta+Sans:wght@400;500;600;700&display=swap` },
  { key: 'dm-sans', label: 'DM Sans', style: 'Douce et claire', stack: `'DM Sans', ${SANS}`, href: `${GF}DM+Sans:wght@400;500;600;700&display=swap` },
  { key: 'manrope', label: 'Manrope', style: 'Élégante, géométrique', stack: `'Manrope', ${SANS}`, href: `${GF}Manrope:wght@400;500;600;700&display=swap` },
  { key: 'outfit', label: 'Outfit', style: 'Moderne, aérée', stack: `'Outfit', ${SANS}`, href: `${GF}Outfit:wght@400;500;600;700&display=swap` },
  { key: 'figtree', label: 'Figtree', style: 'Chaleureuse, très lisible', stack: `'Figtree', ${SANS}`, href: `${GF}Figtree:wght@400;500;600;700&display=swap` },
  { key: 'nunito-sans', label: 'Nunito Sans', style: 'Arrondie, douce', stack: `'Nunito Sans', ${SANS}`, href: `${GF}Nunito+Sans:wght@400;500;600;700&display=swap` },
  { key: 'montserrat', label: 'Montserrat', style: 'Affirmée, élégante', stack: `'Montserrat', ${SANS}`, href: `${GF}Montserrat:wght@400;500;600;700&display=swap` },
  { key: 'lato', label: 'Lato', style: 'Classique, neutre', stack: `'Lato', ${SANS}`, href: `${GF}Lato:wght@400;700&display=swap` },
  { key: 'work-sans', label: 'Work Sans', style: 'Nette, professionnelle', stack: `'Work Sans', ${SANS}`, href: `${GF}Work+Sans:wght@400;500;600;700&display=swap` },
  { key: 'cormorant-garamond', label: 'Cormorant Garamond', style: 'Luxe, à empattements (agrandie et renforcée automatiquement)', stack: `'Cormorant Garamond', Georgia, serif`, href: `${GF}Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap` },
];

export const fontByKey = (key?: string | null) => SITE_FONTS.find((f) => f.key === key) ?? SITE_FONTS[0];
export const adjustFor = (key: string) => (key === 'poppins' ? 'none' : POPPINS_ASPECT);

// Script exécuté dans <head> avant l'affichage : police mémorisée appliquée sans clignotement
export function fontBootScript() {
  const map = Object.fromEntries(SITE_FONTS.map((f) => [f.key, [f.stack, f.href]]));
  return `(function(){try{var k=localStorage.getItem(${JSON.stringify(FONT_STORAGE_KEY)});var F=${JSON.stringify(map)};var f=F[k];if(!f||k==="poppins")return;var r=document.documentElement.style;r.setProperty("--edoto-font",f[0]);r.setProperty("--edoto-font-adjust",${JSON.stringify(POPPINS_ASPECT)});var l=document.createElement("link");l.id="edoto-font-link";l.rel="stylesheet";l.href=f[1];document.head.appendChild(l);}catch(e){}})();`;
}

export function applySiteFont(key: string) {
  if (typeof document === 'undefined') return;
  const font = fontByKey(key);
  const root = document.documentElement.style;
  root.setProperty('--edoto-font', font.stack);
  root.setProperty('--edoto-font-adjust', adjustFor(font.key));
  let link = document.getElementById('edoto-font-link') as HTMLLinkElement | null;
  if (!font.href) {
    link?.remove();
  } else {
    if (!link) {
      link = document.createElement('link');
      link.id = 'edoto-font-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== font.href) link.setAttribute('href', font.href);
  }
  try {
    localStorage.setItem(FONT_STORAGE_KEY, font.key);
  } catch {}
}

export async function syncSiteFont(apiBase?: string) {
  if (!apiBase) return;
  try {
    const res = await fetch(`${apiBase}/site-appearance`);
    if (!res.ok) return;
    const data = await res.json();
    if (data?.font) applySiteFont(data.font);
  } catch {}
}
