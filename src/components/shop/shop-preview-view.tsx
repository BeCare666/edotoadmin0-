'use client';

import {
  useModalAction,
  useModalState,
} from '@/components/ui/modal/modal.context';
import { siteSettings } from '@/settings/site.settings';
import { Shop, ShopDocument } from '@/types';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import { useShopQuery } from '@/data/shop';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

const PLACEHOLDER = siteSettings?.product?.placeholder ?? '/product-placeholder.svg';

const API_BASE = (typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_REST_API_ENDPOINT
  : process.env.NEXT_PUBLIC_REST_API_ENDPOINT) ?? '';

function getLogoUrl(shop: Shop | null): string {
  if (!shop) return PLACEHOLDER;
  const rec = shop as unknown as Record<string, unknown>;
  const logo = shop.logo as { thumbnail?: string; original?: string; url?: string } | undefined;
  const url =
    shop.logo_image_url ??
    (typeof logo === 'string' ? logo : null) ??
    logo?.thumbnail ??
    logo?.original ??
    logo?.url ??
    (rec.logo_thumbnail as string | undefined) ??
    (rec.logo_original as string | undefined) ??
    (rec.logo_url as string | undefined) ??
    (rec.image_url as string | undefined) ??
    null;
  if (!url || url === PLACEHOLDER) return PLACEHOLDER;
  const base = API_BASE.replace(/\/$/, '');
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${base}${url}`;
  return `${base}/${url}`;
}

function toAbsoluteUrl(url: string): string {
  if (!url) return '';
  const base = API_BASE.replace(/\/$/, '');
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${base}${url}`;
  return `${base}/${url}`;
}

function normalizeDocuments(shop: Shop | undefined): ShopDocument[] {
  if (!shop) return [];
  const raw = shop.documents ?? (shop as Record<string, unknown>).documents;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: unknown }).data)) {
    return (raw as { data: ShopDocument[] }).data;
  }
  return [];
}

export default function ShopPreviewView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data } = useModalState();
  const { openModal, closeModal } = useModalAction();

  const shop = data?.shop as Shop | undefined;
  const detailsUrl = data?.detailsUrl as string | undefined;
  const approveData = data?.approveData as { id: string; data: Record<string, unknown> } | undefined;

  const { data: shopDetail } = useShopQuery(
    { slug: shop?.slug ?? '', with: 'documents' },
    { enabled: Boolean(shop?.slug) }
  );

  const shopWithLogo = shopDetail ?? shop;
  const logoSrc = useMemo(
    () => getLogoUrl(shopWithLogo ?? null),
    [shopWithLogo]
  );
  const documents = useMemo(
    () => normalizeDocuments(shopDetail ?? shop),
    [shopDetail, shop]
  );
  const [previewDoc, setPreviewDoc] = useState<ShopDocument | null>(null);

  if (!shop) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <p className="text-center text-gray-500">{t('common:text-loading')}</p>
      </div>
    );
  }
  const ownerName = (shopDetail?.owner ?? shop.owner)?.name ?? shop.owner_id ?? '—';
  const addressParts = [
    shop.street_address,
    shop.address?.city,
    shop.address?.state,
    shop.address?.zip,
    shop.country ?? shop.address?.country,
  ].filter(Boolean);
  const addressStr = addressParts.length > 0 ? addressParts.join(', ') : '—';

  const handleValidateAccount = () => {
    closeModal();
    if (approveData?.id) {
      openModal('SHOP_APPROVE_VIEW', approveData);
    }
  };

  const handleRefuseAccount = () => {
    closeModal();
    if (shop?.id) {
      openModal('SHOP_DISAPPROVE_VIEW', shop.id);
    }
  };

  const openDocUrl = (doc: ShopDocument) => {
    const url = toAbsoluteUrl(doc.url ?? doc.thumbnail ?? '');
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-h-[85vh] overflow-y-auto rounded-2xl border border-border-200 bg-light shadow-elevated">
      {/* En-tête – charte graphique (gray-100, accent) */}
      <div className="border-b border-border-200 bg-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-heading">
          {t('common:shop-preview-title')}
        </h2>
        <p className="mt-0.5 text-sm text-body">
          {t('common:shop-preview-subtitle')}
        </p>
      </div>

      <div className="space-y-6 bg-gray-50/50 p-6">
        {/* Logo + Nom + Statut */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-border-200 bg-gray-100">
            <img
              src={logoSrc}
              alt={shop.name ?? ''}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER;
              }}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-heading">{shop.name ?? '—'}</h3>
            <p className="text-sm text-body">@{shop.slug ?? '—'}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                shop.is_active
                  ? 'bg-status-complete/10 text-status-complete'
                  : 'bg-status-pending/10 text-status-pending'
              }`}
            >
              {shop.is_active ? t('common:text-active') : t('common:text-inactive')}
            </span>
          </div>
        </div>

        {/* Infos fournisseur – fond et bordures charte */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border-200 bg-gray-100/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-body">
              {t('common:shop-preview-owner')}
            </dt>
            <dd className="mt-1 font-medium text-heading">{ownerName}</dd>
          </div>
          <div className="rounded-xl border border-border-200 bg-gray-100/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-body">
              {t('common:shop-preview-contact')}
            </dt>
            <dd className="mt-1 font-medium text-heading">{shop.contact ?? '—'}</dd>
          </div>
          <div className="rounded-xl border border-border-200 bg-gray-100/80 p-4 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-body">
              {t('common:shop-preview-address')}
            </dt>
            <dd className="mt-1 font-medium text-heading">{addressStr}</dd>
          </div>
          {shop.description ? (
            <div className="rounded-xl border border-border-200 bg-gray-100/80 p-4 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wider text-body">
                {t('common:shop-preview-description')}
              </dt>
              <dd className="mt-1 text-sm text-body-dark whitespace-pre-wrap">
                {shop.description}
              </dd>
            </div>
          ) : null}
        </div>

        {/* Documents fournis par le fournisseur */}
        <div className="rounded-xl border border-border-200 bg-gray-100/80 p-4 sm:col-span-2">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-heading">
            {t('common:shop-preview-documents-title')}
          </h4>
          <p className="mt-1 text-xs text-body">
            {t('common:shop-preview-documents-subtitle')}
          </p>
          {documents.length === 0 ? (
            <p className="mt-3 text-sm text-body-dark">
              {t('common:shop-preview-documents-empty')}
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {documents.map((doc, idx) => {
                const docUrl = toAbsoluteUrl(doc.url ?? '');
                const thumbUrl = doc.thumbnail ? toAbsoluteUrl(doc.thumbnail) : docUrl;
                const isImage = /\.(jpe?g|png|gif|webp)$/i.test(doc.url ?? '') ||
                  (doc.type ?? '').toLowerCase().startsWith('image');
                const isPdf = /\.pdf$/i.test(doc.url ?? '') || (doc.type ?? '').toLowerCase() === 'pdf';
                return (
                  <div
                    key={doc.id ?? idx}
                    className="flex flex-col overflow-hidden rounded-lg border border-border-200 bg-white shadow-sm"
                  >
                    <div className="relative flex h-32 items-center justify-center bg-gray-100">
                      {isImage && thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={doc.name}
                          className="h-full w-full object-contain cursor-pointer"
                          onClick={() => openDocUrl(doc)}
                        />
                      ) : isPdf ? (
                        <div className="flex flex-col items-center gap-2 text-body">
                          <span className="text-2xl font-bold">PDF</span>
                          <span className="text-xs">{doc.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-body">
                          <span className="text-xs">{doc.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-border-200 px-3 py-2">
                      <span className="min-w-0 truncate text-sm font-medium text-heading" title={doc.name}>
                        {doc.name}
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="small"
                          variant="outline"
                          className="rounded-lg text-xs"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          {t('common:shop-preview-documents-preview')}
                        </Button>
                        <Button
                          size="small"
                          variant="outline"
                          className="rounded-lg text-xs"
                          onClick={() => openDocUrl(doc)}
                        >
                          {t('common:shop-preview-documents-open')}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Prévisualisation plein écran d'un document */}
        {previewDoc && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setPreviewDoc(null)}
          >
            <div className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-white p-2">
              {/\.(jpe?g|png|gif|webp)$/i.test(previewDoc.url ?? '') ? (
                <img
                  src={toAbsoluteUrl(previewDoc.url ?? '')}
                  alt={previewDoc.name}
                  className="max-h-[85vh] w-auto object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <iframe
                  src={toAbsoluteUrl(previewDoc.url ?? '')}
                  title={previewDoc.name}
                  className="h-[80vh] w-[80vw] rounded border-0"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                onClick={() => setPreviewDoc(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border-200 bg-light pt-6">
          <Button
            variant="outline"
            onClick={closeModal}
            className="rounded-xl border-border-base"
          >
            {t('common:text-close')}
          </Button>
          {detailsUrl && (
            <Button
              variant="outline"
              className="rounded-xl border-accent text-accent hover:bg-accent/10"
              onClick={() => {
                closeModal();
                router.push(detailsUrl);
              }}
            >
              {t('common:shop-preview-go-dashboard')}
            </Button>
          )}
          {shop?.id && (
            <>
              <Button
                variant="outline"
                onClick={handleRefuseAccount}
                className="rounded-xl border-red-500 text-red-600 hover:bg-red-50"
              >
                {t('common:shop-preview-refuse')}
              </Button>
              {!shop.is_active && approveData?.id && (
                <Button
                  onClick={handleValidateAccount}
                  className="rounded-xl bg-accent text-light hover:bg-accent-hover"
                >
                  {t('common:shop-preview-validate')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
