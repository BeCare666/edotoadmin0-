'use client';
import React from 'react';
import { IosArrowDown } from '@/components/icons/ios-arrow-down';
import { NoDataFound as IosArrowUp } from '@/components/icons/ios-arrow-up';
import { useTranslation } from 'next-i18next';
import { StickerCardProps } from '@/types';
import { twMerge } from 'tailwind-merge';
import classNames from 'classnames';

const StickerCard = ({
  titleTransKey,
  icon,
  color,
  price,
  indicator,
  indicatorText,
  note,
  link,
  linkText,
  iconClassName,
}: StickerCardProps) => {
  const { t } = useTranslation('widgets');

  return (
    <div
      className={twMerge(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6',
        'shadow-card transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-elevated hover:border-gray-200'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {t(titleTransKey)}
          </span>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-gray-900">
            {price ?? '—'}
          </p>
          {note && (
            <span className="mt-1 block text-xs text-gray-400">Comparé à {note}</span>
          )}
        </div>
        <div
          className={twMerge(
            classNames(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              iconClassName
            )
          )}
          style={{
            backgroundColor: `${color}15`,
            color: color,
            boxShadow: `0 0 0 1px ${color}20`,
          }}
        >
          {icon}
        </div>
      </div>

      {/* --- Indicateur de tendance --- */}
      {indicator && (
        <div className="mt-4 flex items-center space-x-2 text-sm font-medium">
          {indicator === 'up' && (
            <span className="flex items-center text-emerald-500">
              <IosArrowUp width="10px" height="12px" className="inline-block mr-1" />
              {indicatorText}
            </span>
          )}
          {indicator === 'down' && (
            <span className="flex items-center text-rose-500">
              <IosArrowDown width="10px" height="12px" className="inline-block mr-1" />
              {indicatorText}
            </span>
          )}
        </div>
      )}

      <div className="mt-6 h-12 w-full opacity-60">
        <svg viewBox="0 0 100 30" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="h-full w-full">
          <path d="M0 18 L10 15 L20 16 L30 10 L40 11 L50 8 L60 12 L70 10 L80 14 L90 13 L100 9" />
        </svg>
      </div>

      {/* --- Lien en bas si défini --- */}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
        >
          {linkText}
        </a>
      )}

      {/* --- Glow d’arrière-plan subtil --- */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${color}12 0%, transparent 70%)` }}
      />
    </div>
  );
};

export default StickerCard;
