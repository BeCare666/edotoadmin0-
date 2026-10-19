import ReviewList from '@/components/reviews/review-list';
import Layout from '@/components/layouts/admin';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { SortOrder } from '@/types';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useReviewsQuery } from '@/data/review';
import { adminOnly } from '@/utils/auth-utils';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';

// Avis (19/10/2026) : recherche (produit, client, commentaire), note et période réellement appliquées par l'API.
// La barre reste affichée pendant le chargement (l'ancien écran de chargement la faisait disparaître).
const EMPTY: FilterValues = { rating: '', date_from: '', date_to: '' };
const SORTS = [
  { value: 'created_at:desc', label: 'Plus récents' },
  { value: 'created_at:asc', label: 'Plus anciens' },
  { value: 'rating:desc', label: 'Meilleures notes' },
  { value: 'rating:asc', label: 'Notes les plus basses' },
];
const FILTERS: FilterDef[] = [
  {
    type: 'chips',
    key: 'rating',
    label: 'Note',
    options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} étoile${n > 1 ? 's' : ''}` })),
  },
  { type: 'dates', key: 'period', label: "Date de l'avis", fromKey: 'date_from', toKey: 'date_to' },
];

export default function Reviews() {
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [sort, setSort] = useState('created_at:desc');
  const [orderBy, sortedBy] = sort.split(':');
  const { reviews, paginatorInfo, loading, error } = useReviewsQuery({
    limit: 15,
    page,
    orderBy,
    sortedBy: sortedBy as SortOrder,
    text: search,
    ...Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '')),
  } as any);

  const total = paginatorInfo?.total ?? 0;

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Retours clients</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">{t('form:input-label-reviews')}</h1>
      </div>
      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Produit, client ou commentaire…' }}
        filters={FILTERS}
        values={values}
        onChange={(patch) => { setValues((v) => ({ ...v, ...patch })); setPage(1); }}
        onReset={() => { setValues(EMPTY); setSearch(''); setSort('created_at:desc'); setPage(1); }}
        sort={{ value: sort, options: SORTS, onChange: (v) => { setSort(v); setPage(1); } }}
        resultLabel={loading ? 'Recherche…' : `${total} avis`}
      />
      {error ? (
        <ErrorMessage message={error.message} />
      ) : loading && !reviews?.length ? (
        <Loader text={t('common:text-loading')} simple={false} />
      ) : (
        <ReviewList
          reviews={reviews}
          paginatorInfo={paginatorInfo}
          onPagination={setPage}
          onOrder={(col: string) => {
            if (col !== 'rating' && col !== 'created_at') return;
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
Reviews.authenticate = {
  permissions: adminOnly,
};
Reviews.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common', 'table'])),
  },
});
