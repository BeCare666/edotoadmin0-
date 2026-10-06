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

  const tint = color || '#1F1B16';

  // Carte statistique E.doto : même présentation que les dashboards point de retrait / sponsor
  return (
    <div
      className={twMerge(
        'group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[#EDE6DC] bg-white/90 p-5',
        'shadow-[0_1px_2px_rgba(60,40,20,0.04),0_12px_32px_-18px_rgba(60,40,20,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(60,40,20,0.25)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.12em] text-[#9A8E80]">
            {t(titleTransKey)}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold tabular-nums text-[#1F1B16] sm:text-[28px]">
            {price ?? '…'}
          </p>
          {note && (
            <p className="mt-1 text-xs text-[#7A6E62]">Comparé à {note}</p>
          )}
        </div>
        {icon && (
          <span
            className={twMerge(
              classNames(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-5 [&>svg]:w-5',
                iconClassName,
              ),
            )}
            style={{ backgroundColor: `${tint}14`, color: tint }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* --- Indicateur de tendance --- */}
      {indicator && (
        <div className="mt-4 flex items-center space-x-2 text-sm font-medium">
          {indicator === 'up' && (
            <span className="flex items-center text-[#3F6B45]">
              <IosArrowUp width="10px" height="12px" className="mr-1 inline-block" />
              {indicatorText}
            </span>
          )}
          {indicator === 'down' && (
            <span className="flex items-center text-[#9B2C2C]">
              <IosArrowDown width="10px" height="12px" className="mr-1 inline-block" />
              {indicatorText}
            </span>
          )}
        </div>
      )}

      {/* --- Lien en bas si défini --- */}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 text-xs font-medium text-[#C2185B] transition-colors hover:underline"
        >
          {linkText}
        </a>
      )}
    </div>
  );
};

export default StickerCard;
