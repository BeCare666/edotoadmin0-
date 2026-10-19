import QuestionList from '@/components/question/question-list';
import Layout from '@/components/layouts/admin';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { SortOrder } from '@/types';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useQuestionsQuery } from '@/data/question';
import { adminOnly } from '@/utils/auth-utils';
import EdotoFilterBar from '@/components/filters/edoto-filter-bar';

// Questions (19/10/2026) : recherche réelle dans la question et la réponse ; barre conservée pendant le chargement.
export default function Questions() {
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { questions, paginatorInfo, loading, error } = useQuestionsQuery({
    limit: 15,
    page,
    answer: 'null',
    orderBy,
    sortedBy,
    text: search,
  } as any);
  const total = paginatorInfo?.total ?? 0;

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Retours clients</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">{t('common:sidebar-nav-item-questions')}</h1>
      </div>
      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Texte de la question ou de la réponse…' }}
        values={{}}
        onChange={() => {}}
        onReset={() => { setSearch(''); setPage(1); }}
        resultLabel={loading ? 'Recherche…' : `${total} question${total > 1 ? 's' : ''}`}
      />
      {error ? (
        <ErrorMessage message={error.message} />
      ) : loading && !questions?.length ? (
        <Loader text={t('common:text-loading')} />
      ) : (
        <QuestionList
          questions={questions}
          paginatorInfo={paginatorInfo}
          onPagination={setPage}
          onOrder={setOrder}
          onSort={setColumn}
        />
      )}
    </>
  );
}

Questions.authenticate = {
  permissions: adminOnly,
};
Questions.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common', 'table'])),
  },
});
