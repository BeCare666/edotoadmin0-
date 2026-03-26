import Label from '@/components/ui/label';
import { Control, useFormContext } from 'react-hook-form';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { useCategoriesQuery } from '@/data/category';
import { useRouter } from 'next/router';
import cn from 'clsx';
import { normalizeProductCategoriesForForm } from './form-utils';
import type { Product } from '@/types';

/** Petite icône check inline (SVG) */
function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  control: Control<any>;
  setValue: any;
  /** En édition : produit chargé par l’API. Utilisé pour afficher les catégories même si le formulaire n’a pas encore été reset. */
  initialProduct?: Product | null;
}

const ProductCategoryInput = ({ control, setValue, initialProduct }: Props) => {
  const { locale } = useRouter();
  const { t } = useTranslation('common');
  const { watch } = useFormContext();

  const { categories, loading } = useCategoriesQuery({
    limit: 999,
    language: locale,
  });

  const [openPanel, setOpenPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [subCategories, setSubCategories] = useState<any[] | null>(null);
  const [subSubCategories, setSubSubCategories] = useState<any[] | null>(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState<Set<number>>(new Set());
  const [selectedSubSubCategories, setSelectedSubSubCategories] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement | null>(null);
  const syncInProgressRef = useRef(false);
  const lastSyncedKeyRef = useRef<string | null>(null);

  const API_BASE = `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}`;
  const headers = { 'Content-Type': 'application/json' };
  const formCategories = watch('categories');

  function toggleSet(setState: React.Dispatch<React.SetStateAction<Set<number>>>, value: number) {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function loadSubCategories(categoryId: number) {
    setSubCategories(null);
    setSubSubCategories(null);
    try {
      const res = await fetch(`${API_BASE}/souscategories/bycategory?categories_id=${categoryId}`, { headers });
      if (!res.ok) throw new Error('Failed to load subcategories');
      const payload = await res.json();
      setSubCategories(payload?.data ?? []);
    } catch (err) {
      console.error(err);
      setSubCategories([]);
    }
  }

  async function loadSubSubCategories(subCategoryId: number) {
    setSubSubCategories(null);
    try {
      const res = await fetch(`${API_BASE}/subcategories/bycategory?categories_id=${subCategoryId}`, { headers });
      if (!res.ok) throw new Error('Failed to load subsubcategories');
      const payload = await res.json();
      setSubSubCategories(payload?.data ?? []);
    } catch (err) {
      console.error(err);
      setSubSubCategories([]);
    }
  }

  function handleCategoryClick(catId: number) {
    setSelectedCategory(catId);
    setSelectedSubCategories(new Set());
    setSelectedSubSubCategories(new Set());
    loadSubCategories(catId);
  }

  function handleSubCategoryClick(subId: number) {
    toggleSet(setSelectedSubCategories, subId);
    if (!selectedSubCategories.has(subId)) loadSubSubCategories(subId);
    else setSubSubCategories(null);
  }

  function handleSubSubCategoryClick(subSubId: number) {
    toggleSet(setSelectedSubSubCategories, subSubId);
  }

  function applySelection() {
    const categoriesPayload = [
      {
        categories_id: selectedCategory,
        sous_categories_id: Array.from(selectedSubCategories),
        sub_categories_id: Array.from(selectedSubSubCategories),
      },
    ];

    setValue('categories', categoriesPayload);
    setOpenPanel(false);
  }

  /** Synchronise l’état du panneau avec les valeurs du formulaire (édition). Permet de récupérer et modifier catégorie/sous/sous-sous. */
  type CategoryRow = { categories_id: number; sous_categories_id: number[]; sub_categories_id: number[] };

  /** Parse ids depuis API (tableau, chaîne "1,2,3", ou nombre unique) pour pré-sélection. */
  function parseIdsForSelection(v: any): number[] {
    if (v == null || v === '') return [];
    if (Array.isArray(v)) return v.map(Number).filter((n) => !Number.isNaN(n));
    if (typeof v === 'string') return v.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
    const n = Number(v);
    return Number.isNaN(n) ? [] : [n];
  }

  function syncFromRow(first: CategoryRow) {
    const catId = first?.categories_id != null ? Number(first.categories_id) : null;
    if (catId == null || catId === 0) {
      setSelectedCategory(null);
      setSubCategories(null);
      setSubSubCategories(null);
      setSelectedSubCategories(new Set());
      setSelectedSubSubCategories(new Set());
      return;
    }
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    setSelectedCategory(catId);

    const sousIds = parseIdsForSelection(first.sous_categories_id);
    const subIds = parseIdsForSelection(first.sub_categories_id);

    fetch(`${API_BASE}/souscategories/bycategory?categories_id=${catId}`, { headers })
      .then((r) => r.json())
      .then((payload) => {
        syncInProgressRef.current = false;
        const sous = payload?.data ?? [];
        setSubCategories(sous);
        setSelectedSubCategories(new Set(sousIds));
        setSelectedSubSubCategories(new Set(subIds));

        // Charger les sous-sous-catégories pour toutes les sous-catégories sélectionnées (pour afficher toutes les cases cochées).
        if (sousIds.length === 0) {
          setSubSubCategories([]);
          return;
        }
        Promise.all(
          sousIds.map((sousId) =>
            fetch(`${API_BASE}/subcategories/bycategory?categories_id=${sousId}`, { headers })
              .then((r2) => r2.json())
              .then((p2) => (p2?.data ?? []) as any[])
          )
        )
          .then((arrays) => {
            const seen = new Set<number>();
            const merged = arrays.flat().filter((ss: any) => {
              const ssid = Number(ss?.id ?? ss?.sub_category_id ?? ss?.sub_categories_id ?? ss?.attributes?.id ?? 0);
              if (Number.isNaN(ssid) || ssid === 0 || seen.has(ssid)) return false;
              seen.add(ssid);
              return true;
            });
            setSubSubCategories(merged);
          })
          .catch(() => setSubSubCategories([]));
      })
      .catch(() => {
        syncInProgressRef.current = false;
        setSubCategories([]);
      });
  }

  function syncFromForm() {
    const first = formCategories?.[0] as CategoryRow | undefined;
    if (!first?.categories_id) return;
    syncFromRow(first);
  }

  // Clé stable basée sur le résultat normalisé (toutes formes API supportées).
  const normalizedForSnapshot = initialProduct ? normalizeProductCategoriesForForm(initialProduct) : [];
  const productCategoriesSnapshot =
    normalizedForSnapshot.length > 0
      ? JSON.stringify(normalizedForSnapshot.map((r) => ({ cat: r.categories_id, sous: r.sous_categories_id, sub: r.sub_categories_id })))
      : '';

  // Édition : initialisation depuis le produit — ne pas attendre la liste des catégories (categories).
  useEffect(() => {
    if (!initialProduct) return;
    const normalized = normalizeProductCategoriesForForm(initialProduct);
    if (normalized.length === 0) return;
    const first = normalized[0];
    const key = `product-${first.categories_id}-${(first.sous_categories_id ?? []).join(',')}-${(first.sub_categories_id ?? []).join(',')}`;
    if (lastSyncedKeyRef.current === key) return;
    lastSyncedKeyRef.current = key;
    setValue('categories', normalized);
    syncFromRow(first);
  }, [initialProduct?.id, productCategoriesSnapshot, setValue]);

  const formCategoriesKey =
    formCategories?.length && formCategories[0]?.categories_id != null
      ? `${formCategories[0].categories_id}-${(formCategories[0].sous_categories_id ?? []).join(',')}-${(formCategories[0].sub_categories_id ?? []).join(',')}`
      : '';

  // Édition : quand le formulaire a des catégories (après reset), récupérer et afficher dans le sélect.
  useEffect(() => {
    if (!formCategoriesKey) return;
    if (lastSyncedKeyRef.current === formCategoriesKey) return;
    lastSyncedKeyRef.current = formCategoriesKey;
    syncFromForm();
  }, [formCategoriesKey]);

  // À l’ouverture du panneau : resynchroniser avec le formulaire pour afficher la sélection actuelle et permettre la modification.
  function handleOpenPanel() {
    if (formCategories?.length && formCategories[0]?.categories_id != null) {
      syncFromForm();
    }
    setOpenPanel((p) => !p);
  }

  // close panel on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpenPanel(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selectedCategoryName =
    selectedCategory != null
      ? categories.find((c) => Number(c.id) === selectedCategory || c.id === selectedCategory)?.name
      : null;

  return (
    <div className="mb-5 relative" ref={containerRef}>
      <Label>{t('form:input-label-categories')}</Label>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenPanel}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenPanel()}
        className={cn(
          'flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-sm',
          'text-gray-900 placeholder:text-gray-400 transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/20'
        )}
      >
        <span className={selectedCategoryName ? 'text-body' : 'text-gray-400'}>
          {selectedCategoryName ?? t('text-select-category')}
        </span>
        <span className="text-gray-400" aria-hidden>▾</span>
      </div>

      {openPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white p-4 shadow-lg max-h-[400px] overflow-auto">
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-heading">{t('form:categories')}</h4>
            <ul className="space-y-0.5">
              {categories.map((c) => {
                const isSelected = selectedCategory !== null && (Number(c.id) === selectedCategory || c.id === selectedCategory);
                return (
                  <li
                    key={c.id}
                    className={cn(
                      'cursor-pointer rounded-lg px-2 py-2 text-sm text-body transition-colors hover:bg-gray-50',
                      { 'bg-accent/10 text-accent': isSelected }
                    )}
                    onClick={() => handleCategoryClick(Number(c.id))}
                  >
                    {c.name} {c.has_children ? '▸' : ''}
                  </li>
                );
              })}
            </ul>
          </div>

          {subCategories && subCategories.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-body text-gray-600">{t('form:subcategories')}</h4>
              <ul className="space-y-0.5">
                {subCategories.map((s) => {
                  const raw = s as any;
                  const sid = Number(raw?.id ?? raw?.sous_category_id ?? raw?.sous_categories_id ?? raw?.attributes?.id ?? raw?.attributes?.sous_category_id);
                  const selected = !Number.isNaN(sid) && selectedSubCategories.has(sid);
                  const displayName = raw?.name ?? raw?.attributes?.name ?? raw?.sous_category_name ?? raw?.attributes?.sous_category_name ?? String(sid);
                  return (
                    <li
                      key={sid || (s as any).id}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm text-body transition-colors hover:bg-gray-50',
                        { 'bg-accent/10': selected }
                      )}
                      onClick={() => handleSubCategoryClick(sid)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border',
                            selected ? 'border-accent bg-accent text-white' : 'border-gray-300 bg-white'
                          )}
                        >
                          {selected && <CheckIcon className="h-3 w-3 text-white" />}
                        </div>
                        {displayName}
                      </div>
                      {raw?.has_children ? <small className="text-gray-400">▸</small> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {subSubCategories && subSubCategories.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-gray-600">{t('form:sub-subcategories')}</h4>
              <ul className="space-y-0.5">
                {subSubCategories.map((ss) => {
                  const raw = ss as any;
                  const ssid = Number(raw?.id ?? raw?.sub_category_id ?? raw?.sub_categories_id ?? raw?.attributes?.id ?? raw?.attributes?.sub_category_id);
                  const selected = !Number.isNaN(ssid) && selectedSubSubCategories.has(ssid);
                  const displayName = raw?.name ?? raw?.attributes?.name ?? raw?.sub_category_name ?? raw?.attributes?.sub_category_name ?? String(ssid);
                  return (
                    <li
                      key={ssid || (ss as any).id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-body transition-colors hover:bg-gray-50',
                        { 'bg-accent/10': selected }
                      )}
                      onClick={() => handleSubSubCategoryClick(ssid)}
                    >
                      <div
                        className={cn(
                          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border',
                          selected ? 'border-accent bg-accent text-white' : 'border-gray-300 bg-white'
                        )}
                      >
                        {selected && <CheckIcon className="h-3 w-3 text-white" />}
                      </div>
                      {displayName}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border-base pt-3">
            <button
              type="button"
              onClick={() => setOpenPanel(false)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-body hover:bg-gray-50"
            >
              {t('form:close')}
            </button>
            <button
              type="button"
              onClick={applySelection}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              {t('form:apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCategoryInput;
