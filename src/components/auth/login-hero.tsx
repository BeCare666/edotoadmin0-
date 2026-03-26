'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';

/**
 * LoginHero – nouvelle vue orientée santé sexuelle
 * Dimensions respectées, responsive, accessible
 */
export default function LoginHero() {
  const { t } = useTranslation('common');

  return (
    <div
      className="relative flex min-h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-pink-600 via-pink-400 to-purple-500 px-8 py-12 md:px-12 lg:px-16"
      role="banner"
      aria-label={t('admin-login-title')}
    >
      {/* Overlay doux pour lisibilité */}
      <div className="pointer-events-none absolute inset-0 bg-black/20" aria-hidden />

      {/* Illustrations/flottants abstraits */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-300/20 blur-3xl animate-spin-slow" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 rounded-full bg-pink-300/20 blur-3xl animate-ping-slow" />
      </div>

      {/* Cartes et icônes flottantes pour dynamisme */}
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-wrap gap-4 opacity-90">
          <FloatingCard className="translate-y-0" />
          <FloatingIcon type="heart" className="-translate-y-4 translate-x-2" />
          <FloatingIcon type="users" className="translate-y-2 translate-x-4" />
        </div>
      </div>

      {/* Tagline et proposition de valeur */}
      <div className="relative z-10 mt-auto max-w-lg">
        <h2 className="text-2xl font-semibold leading-tight text-white drop-shadow-sm md:text-3xl lg:text-4xl">
          {t('login-hero-tagline')}
        </h2>
        <p className="mt-4 text-base text-white/90 drop-shadow-sm md:text-lg">
          {t('login-hero-value')}
        </p>
      </div>
    </div>
  );
}

/* Floating card simple décorative */
function FloatingCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex h-24 w-36 flex-col rounded-xl border border-white/20 bg-white/10 p-3 shadow-xl backdrop-blur-sm ${className}`}
      aria-hidden
    >
      <div className="mb-2 h-8 w-full rounded-md bg-white/30" />
      <div className="h-2 w-2/3 rounded bg-white/20" />
      <div className="mt-1 h-2 w-1/2 rounded bg-white/20" />
    </div>
  );
}

/* Floating icons décoratifs */
function FloatingIcon({
  type,
  className = '',
}: {
  type: 'heart' | 'users';
  className?: string;
}) {
  const icon =
    type === 'heart' ? (
      <svg className="h-8 w-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
        />
      </svg>
    ) : (
      <svg className="h-8 w-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    );

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm ${className}`}
      aria-hidden
    >
      {icon}
    </div>
  );
}

/**
 * Version compacte mobile
 */
export function LoginHeroCompact() {
  const { t } = useTranslation('common');
  return (
    <div
      className="bg-gradient-to-r from-pink-600 via-pink-400 to-purple-500 px-6 py-8"
      role="banner"
    >
      <p className="text-lg font-semibold text-white drop-shadow-sm text-center">
        {t('login-hero-tagline')}
      </p>
    </div>
  );
}