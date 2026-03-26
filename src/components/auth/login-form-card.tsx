'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from '@/components/ui/link';
import Image from 'next/image';
import { siteSettings } from '@/settings/site.settings';

type LoginFormCardProps = {
  children: React.ReactNode;
  /** Optional context message (e.g. become seller) */
  headerMessage?: React.ReactNode;
};

/**
 * Carte de connexion super admin : logo, titre, formulaire.
 * Pas de "Mot de passe oublié" ni "Créer un compte". Design pro.
 */
export default function LoginFormCard({ children, headerMessage }: LoginFormCardProps) {
  const { t } = useTranslation('common');
  const logoUrl = siteSettings?.logo?.url ?? '/logo_red.png';
  const logoWidth = siteSettings?.logo?.width ?? 138;
  const logoHeight = siteSettings?.logo?.height ?? 34;
  const logoAlt = siteSettings?.logo?.alt ?? 'Logo';

  return (
    <div className="w-full max-w-[400px] border border-gray-100 bg-white p-8 shadow-2xl sm:p-10">
      <div className="flex flex-col items-center text-center">
        <Link
          href={siteSettings?.logo?.href ?? '/'}
          className="inline-block focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-opacity hover:opacity-90"
        >
          <Image
            src={logoUrl}
            alt={logoAlt}
            width={logoWidth}
            height={logoHeight}
            className="h-auto w-auto object-contain"
            priority
          />
        </Link>
        {headerMessage ? (
          <p className="mt-5 text-sm italic text-body">{headerMessage}</p>
        ) : null}
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-heading sm:text-2xl">
          {t('login-welcome-back')}
        </h1>
        <p className="mt-1.5 text-sm text-body">
          {t('login-subtitle')}
        </p>
      </div>

      <div className="mt-8" role="form" aria-label="Login form">
        {children}
      </div>
    </div>
  );
}
