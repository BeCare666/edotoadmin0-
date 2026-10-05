import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import ProductList from '@/components/product/product-list';
import ErrorMessage from '@/components/ui/error-message';
import { useProductFacetsQuery, useProductsQuery } from '@/data/product';
import { useCategoriesQuery } from '@/data/category';
import { SortOrder } from '@/types';
import { PRODUCT_STATUS_LABEL } from '@/components/product/product-status';

// Liste des produits de l'admin avec filtres réels : chaque option vient de la base
// (statuts présents, catégories et étiquettes réellement utilisées, compteurs de stock…).

const SORTS = [
  { value: 'created_at:desc', label: 'Plus récents' },
  { value: 'created_at:asc', label: 'Plus anciens' },
  { value: 'updated_at:desc', label: 'Modifiés récemment' },
  { value: 'name:asc', label: 'Nom A → Z' },
  { value: 'name:desc', label: 'Nom Z → A' },
  { value: 'price:asc', label: 'Prix croissant' },
  { value: 'price:desc', label: 'Prix décroissant' },
  { value: 'quantity:asc', label: 'Stock le plus bas' },
  { value: 'quantity:desc', label: 'Stock le plus haut' },
];

const EMPTY: FilterValues = { status: '', categories: '', tag: '', stock: '', on_sale: '', is_origin: '', min_price: '', max_price: '' };

type Props = { shopId?: number; shopSlug?: string; createHref?: string };

export default function ProductsBrowser({ shopId, createHref }: Props) {
  const router = useRouter();
  const { locale } = router;
  const [search, setSearch] = useState('');

  // Recherche passée dans l'adresse (ex. lien « stock faible » de la cloche : /products?search=…)
  useEffect(() => {
    if (router.isReady && typeof router.query.search === 'string') setSearch(router.query.search);
  }, [router.isReady, router.query.search]);
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [sort, setSort] = useState('created_at:desc');
  const [page, setPage] = useState(1);
  const [orderBy, sortedBy] = sort.split(':');

  const { facets } = useProductFacetsQuery(shopId);
  const { categories } = useCategoriesQuery({ limit: 999, language: locale });

  const { products, loading, paginatorInfo, error } = useProductsQuery(
    {
      language: locale,
      limit: 20,
      page,
      name: search,
      shop_id: shopId,
      orderBy,
      sortedBy: sortedBy as SortOrder,
      ...(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '')) as any),
    },
    { enabled: shopId === undefined || Boolean(shopId) },
  );

  const update = (patch: FilterValues) => {
    setValues((v) => ({ ...v, ...patch }));
    setPage(1);
  };

  const filters: FilterDef[] = useMemo(() => {
    const catName = new Map((categories ?? []).map((c: any) => [Number(c.id), c.name]));
    const stock = facets?.stock ?? {};
    return [
      {
        type: 'chips',
        key: 'categories',
        label: 'Catégorie',
        options: (facets?.categories ?? []).map((c: any) => ({ value: String(c.id), label: catName.get(c.id) ?? `Catégorie ${c.id}`, count: c.count })),
      },
      {
        type: 'chips',
        key: 'tag',
        label: 'Étiquette',
        options: (facets?.tags ?? []).map((t: any) => ({ value: String(t.id), label: t.name, count: t.count })),
      },
      {
        type: 'chips',
        key: 'stock',
        label: 'Stock',
        options: [
          { value: 'out', label: 'En rupture', count: stock.out ?? 0 },
          { value: 'low', label: 'Stock faible (1 à 9)', count: stock.low ?? 0 },
          { value: 'ok', label: 'Disponible (10 et +)', count: stock.ok ?? 0 },
        ],
      },
      {
        type: 'chips',
        key: 'on_sale',
        label: 'Prix promo',
        options: [
          { value: 'true', label: 'En promo', count: facets?.on_sale ?? 0 },
          { value: 'false', label: 'Sans promo', count: Math.max(0, (facets?.total ?? 0) - (facets?.on_sale ?? 0)) },
        ],
      },
      {
        type: 'chips',
        key: 'is_origin',
        label: 'Origine',
        options: [
          { value: 'true', label: 'Produit local', count: facets?.local_origin ?? 0 },
          { value: 'false', label: 'Importé', count: Math.max(0, (facets?.total ?? 0) - (facets?.local_origin ?? 0)) },
        ],
      },
      {
        type: 'range',
        key: 'price',
        label: 'Prix payé (promo sinon prix)',
        minKey: 'min_price',
        maxKey: 'max_price',
        unit: 'FCFA',
        minHint: facets?.price?.min ?? null,
        maxHint: facets?.price?.max ?? null,
      },
    ];
  }, [facets, categories]);

  const total = paginatorInfo?.total ?? 0;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Catalogue</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">Produits</h1>
          <p className="mt-1 text-sm text-body">
            {facets ? `${facets.total.toLocaleString('fr-FR')} produit${facets.total > 1 ? 's' : ''} au catalogue` : 'Chargement du catalogue…'}
            {facets?.stock?.out ? ` · ${facets.stock.out} en rupture` : ''}
            {facets?.stock?.low ? ` · ${facets.stock.low} en stock faible` : ''}
          </p>
        </div>
        {createHref && (
          <Link
            href={createHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-heading px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent"
          >
            <span className="text-lg leading-none">+</span> Ajouter un produit
          </Link>
        )}
      </div>

      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Rechercher par nom ou SKU…' }}
        quick={{
          key: 'status',
          allLabel: 'Tous',
          allCount: facets?.total,
          options: (facets?.statuses ?? []).map((s: any) => ({ value: s.value, label: PRODUCT_STATUS_LABEL[s.value] ?? s.value, count: s.count })),
        }}
        filters={filters}
        values={values}
        onChange={update}
        onReset={() => { setValues(EMPTY); setSearch(''); setSort('created_at:desc'); setPage(1); }}
        sort={{ value: sort, options: SORTS, onChange: (v) => { setSort(v); setPage(1); } }}
        resultLabel={loading ? 'Recherche…' : `${total.toLocaleString('fr-FR')} résultat${total > 1 ? 's' : ''}`}
      />

      {error ? (
        <ErrorMessage message={error.message} />
      ) : (
        <ProductList
          products={products}
          paginatorInfo={paginatorInfo}
          onPagination={setPage}
          // Clic sur un en-tête triable : même tri que le menu « Trier »
          onOrder={(col: string) => {
            setSort((prev) => {
              const [c, d] = prev.split(':');
              return `${col}:${c === col && d === 'desc' ? 'asc' : 'desc'}`;
            });
            setPage(1);
          }}
          onSort={() => {}}
        />
      )}
    </>
  );
}
