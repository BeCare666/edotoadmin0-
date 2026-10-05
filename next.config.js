/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config');

// const runtimeCaching = require('next-pwa/cache');
// const withPWA = require('next-pwa')({
//   disable: process.env.NODE_ENV === 'development',
//   dest: 'public',
//   runtimeCaching,
// });

const nextConfig = {
  reactStrictMode: true,
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
