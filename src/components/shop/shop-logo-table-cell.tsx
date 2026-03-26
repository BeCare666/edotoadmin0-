'use client';

import { siteSettings } from '@/settings/site.settings';
import { Shop } from '@/types';
import { useShopQuery } from '@/data/shop';
import { useMemo } from 'react';

const PLACEHOLDER = siteSettings?.product?.placeholder ?? '/product-placeholder.svg';

function getLogoUrlFromRecord(record: Shop): string | null {
  const rec = record as Record<string, unknown>;
  const logo = record.logo as
    | { thumbnail?: string; original?: string; url?: string }
    | string
    | undefined;
  const url =
    record.logo_image_url ??
    (typeof logo === 'string' ? logo : logo?.thumbnail ?? logo?.original ?? logo?.url) ??
    (rec.logo_thumbnail as string | undefined) ??
    (rec.logo_original as string | undefined) ??
    (rec.logo_url as string | undefined) ??
    (rec.image_url as string | undefined) ??
    null;
  if (!url || url === PLACEHOLDER) return null;
  const apiBase = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT ?? '').replace(/\/$/, '');
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${apiBase}${url}`;
  return `${apiBase}/${url}`;
}

type Props = {
  record: Shop;
  name: string;
};

export function ShopLogoTableCell({ record, name }: Props) {
  const slug = record.slug;
  const urlFromRecord = useMemo(() => getLogoUrlFromRecord(record), [record]);

  const { data: shopDetail } = useShopQuery(
    { slug: slug ?? '' },
    { enabled: Boolean(slug) && !urlFromRecord }
  );

  const logoUrl =
    urlFromRecord ??
    (shopDetail?.logo_image_url ?? null) ??
    (shopDetail?.logo as { thumbnail?: string; original?: string } | undefined)?.thumbnail ??
    (shopDetail?.logo as { thumbnail?: string; original?: string } | undefined)?.original ??
    null;

  const resolvedUrl = useMemo(() => {
    if (!logoUrl || logoUrl === PLACEHOLDER) return PLACEHOLDER;
    const apiBase = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT ?? '').replace(/\/$/, '');
    if (logoUrl.startsWith('http')) return logoUrl;
    if (logoUrl.startsWith('/')) return `${apiBase}${logoUrl}`;
    return `${apiBase}/${logoUrl}`;
  }, [logoUrl]);

  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50 shadow-sm">
      <img
        src={resolvedUrl}
        alt={name ?? ''}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.onerror = null;
          target.src = PLACEHOLDER;
        }}
      />
    </div>
  );
}
