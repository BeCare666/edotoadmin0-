/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config');

// const runtimeCaching = require('next-pwa/cache');
// const withPWA = require('next-pwa')({
//   disable: process.env.NODE_ENV === 'development',
//   dest: 'public',
//   runtimeCaching,
// });

// En-têtes de sécurité (audit sécurité 1.3, 22/10/2026).
// La CSP est d'abord en « Report-Only » : elle signale dans la console du navigateur sans rien bloquer.
// Après 7 jours sans alerte : passer la clé en Content-Security-Policy.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://flagcdn.com https://tiles.openfreemap.org https://*.tile.openstreetmap.org",
  "connect-src 'self' https://edotofamily.onrender.com https://tiles.openfreemap.org",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy-Report-Only', value: CSP },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  // Admin uniquement en français : plus de /en ni /ar, pas de détection de la langue du navigateur
  i18n,
  // Anciennes adresses /en/… ou /ar/… → même page en français
  async redirects() {
    return ['en', 'ar', 'de', 'es'].flatMap((l) => [
      { source: `/${l}`, destination: '/', permanent: false, locale: false },
      { source: `/${l}/:path*`, destination: '/:path*', permanent: false, locale: false },
    ]);
  },
  images: {
    domains: [
      '127.0.0.1:8000',
      'via.placeholder.com',
      'res.cloudinary.com',
      's3.amazonaws.com',
      '127.0.0.1',
      'localhost',
      'picsum.photos',
      'pixarlaravel.s3.ap-southeast-1.amazonaws.com',
      'pickbazarlaravel.s3.ap-southeast-1.amazonaws.com',
      'lh3.googleusercontent.com',
      '127.0.0.1:8000',
      'galileecommerce.netlify.app',
      'galileecommerceshopapi-3.onrender.com',
    ],
    unoptimized: true,
  },
  ...(process.env.APPLICATION_MODE === 'production' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
};

module.exports = nextConfig;
