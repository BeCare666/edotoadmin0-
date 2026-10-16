// Règles de saisie de l'admin (16/10/2026), identiques à celles du site (edoto/lib/fieldRules.js)
// et de l'API (edoto-api/src/common/field-rules.ts), qui reste la référence.
import * as yup from 'yup';

// String.raw : l'admin compile en ES5, qui refuse l'écriture /…/u ; le motif est gardé tel quel
export const NAME_RE = new RegExp(String.raw`^[\p{L}][\p{L}\p{M}' .\-]*$`, 'u');
export const ORG_RE = new RegExp(String.raw`^[\p{L}\p{N}][\p{L}\p{M}\p{N}' .,&()\-]*$`, 'u');
export const MIN_AGE = 10;
export const MAX_AGE = 100;

export const PASSWORD_RULES = [
  { key: 'len', label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { key: 'lower', label: 'Une lettre minuscule', test: (p: string) => /[a-z]/.test(p) },
  { key: 'upper', label: 'Une lettre majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'digit', label: 'Un chiffre', test: (p: string) => /\d/.test(p) },
];

// Filtres de frappe : le caractère refusé n'apparaît jamais dans le champ
export const phoneInput = (v: string) => {
  const s = String(v ?? '');
  return (s.trimStart().startsWith('+') ? '+' : '') + s.replace(/\D/g, '').slice(0, 15);
};
export const intInput = (v: string, max = 9) => String(v ?? '').replace(/\D/g, '').slice(0, max);
const NAME_STRIP = new RegExp(String.raw`[^\p{L}\p{M}' .\-]`, 'gu');
export const nameInput = (v: string) => String(v ?? '').replace(NAME_STRIP, '').replace(/\s{2,}/g, ' ');
export const passwordInput = (v: string) => String(v ?? '').replace(/\s/g, '').slice(0, 72);

export function beninToday() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
}
export function ageOn(birth: string, day = beninToday()) {
  const [by, bm, bd] = birth.split('-').map(Number);
  const [y, m, d] = day.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

// Schémas yup réutilisables
export const nameRule = (label = 'Le nom') =>
  yup
    .string()
    .transform((v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v))
    .required(`${label} est obligatoire.`)
    .min(2, `${label} doit contenir au moins 2 caractères.`)
    .max(100, `${label} ne doit pas dépasser 100 caractères.`)
    .matches(NAME_RE, `${label} ne doit contenir que des lettres, espaces, apostrophes ou traits d'union.`);

export const emailRule = () =>
  yup
    .string()
    .trim()
    .required("L'adresse e-mail est obligatoire.")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "L'adresse e-mail n'est pas valide.");

export const phoneRule = (required = true) => {
  const base = yup
    .string()
    .transform((v) => (typeof v === 'string' ? v.replace(/[\s.]/g, '') : v))
    .test('digits', 'Le numéro de téléphone ne doit contenir que des chiffres.', (v) => !v || /^\+?\d+$/.test(v))
    .test('len', 'Le numéro de téléphone doit contenir entre 8 et 15 chiffres.', (v) => {
      if (!v) return true;
      const n = v.replace('+', '').length;
      return n >= 8 && n <= 15;
    });
  return required ? base.required('Le numéro de téléphone est obligatoire.') : base.nullable();
};

export const passwordRule = () =>
  yup
    .string()
    .required('Le mot de passe est obligatoire.')
    .test('space', "Le mot de passe ne doit pas contenir d'espace.", (v) => !v || !/\s/.test(v))
    .max(72, 'Le mot de passe ne doit pas dépasser 72 caractères.')
    .test('rules', 'Le mot de passe doit contenir : 8 caractères minimum, une minuscule, une majuscule et un chiffre.', (v) =>
      PASSWORD_RULES.every((r) => r.test(v || '')),
    );

export const birthDateRule = () =>
  yup
    .string()
    .required('La date de naissance est obligatoire.')
    .test('date', 'Date de naissance non valide.', (s) => {
      if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
      const d = new Date(`${s}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
    })
    .test('future', 'La date de naissance ne peut pas être dans le futur.', (s) => !s || s <= beninToday())
    .test('age', `Il faut avoir au moins ${MIN_AGE} ans.`, (s) => !s || !/^\d{4}-\d{2}-\d{2}$/.test(s) || ageOn(s) >= MIN_AGE)
    .test('max', 'Date de naissance non valide.', (s) => !s || !/^\d{4}-\d{2}-\d{2}$/.test(s) || ageOn(s) <= MAX_AGE);

export const sexRule = () => yup.string().required('Choisissez votre sexe.').oneOf(['female', 'male'], 'Choisissez votre sexe.');

export const SEX_OPTIONS = [
  { value: 'female', label: 'Féminin', hint: 'Femme ou fille' },
  { value: 'male', label: 'Masculin', hint: 'Homme ou garçon' },
];

export const TARGET_SEX_OPTIONS = [
  { value: 'all', label: 'Les deux', hint: 'Tout public' },
  { value: 'female', label: 'Féminin seulement', hint: 'Femmes et filles' },
  { value: 'male', label: 'Masculin seulement', hint: 'Hommes et garçons' },
];
