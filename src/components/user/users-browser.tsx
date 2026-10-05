import UserList from '@/components/user/user-list';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import { useUsersQuery } from '@/data/user';
import { Routes } from '@/config/routes';
import { SortOrder } from '@/types';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import { apiCall } from '@/components/campaign/campaign-api';

// Tous les comptes, avec filtres réels (rôles présents en base, compte actif, e-mail confirmé, période)
const ROLE_LABEL: Record<string, string> = {
  customer: 'Clients',
  super_pickuppoint: 'Points de retrait',
  super_admin: 'Administrateurs',
  sponsor: 'Sponsors',
  store_owner: 'Vendeurs',
  staff: 'Personnel',
};

const SORTS = [
  { value: 'created_at:desc', label: 'Inscrits récemment' },
  { value: 'created_at:asc', label: 'Inscrits en premier' },
  { value: 'name:asc', label: 'Nom A → Z' },
  { value: 'orders_count:desc', label: 'Plus de commandes' },
];

const EMPTY: FilterValues = { role: '', is_active: '', is_verified: '', date_from: '', date_to: '' };

type Props = { fixedRole?: string; eyebrow?: string; title?: string; subtitle?: string };

export default function UsersBrowser({ fixedRole, eyebrow = 'Comptes', title = 'Utilisateurs', subtitle }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at:desc');
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [facets, setFacets] = useState<any>(null);
  const [orderBy, sortedBy] = sort.split(':');

  useEffect(() => {
    apiCall(`users/facets${fixedRole ? `?role=${fixedRole}` : ''}`).then(setFacets).catch(() => setFacets(null));
  }, []);

  const { users, paginatorInfo, loading, error } = useUsersQuery({
    limit: 20,
    page,
    text: search,
    orderBy,
    sortedBy: sortedBy as SortOrder,
    ...(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '')) as any),
    ...(fixedRole ? { role: fixedRole } : {}),
  });

  const filters: FilterDef[] = useMemo(() => [
    { type: 'chips', key: 'is_active', label: 'Compte', options: [
      { value: '1', label: 'Actif', count: facets?.active?.yes ?? 0 },
      { value: '0', label: 'Bloqué', count: facets?.active?.no ?? 0 },
    ] },
    { type: 'chips', key: 'is_verified', label: 'E-mail', options: [
      { value: '1', label: 'Confirmé', count: facets?.verified?.yes ?? 0 },
      { value: '0', label: 'Non confirmé', count: facets?.verified?.no ?? 0 },
    ] },
    { type: 'dates', key: 'period', label: "Date d'inscription", fromKey: 'date_from', toKey: 'date_to' },
  ], [facets]);

  const total = paginatorInfo?.total ?? 0;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">{title}</h1>
          <p className="mt-1 text-sm text-body">
            {subtitle ?? (facets ? `${facets.total} compte${facets.total > 1 ? 's' : ''} : clients, points de retrait, sponsors et administrateurs.` : 'Clients, points de retrait, sponsors et administrateurs.')}
          </p>
        </div>
        <Link href={Routes.user.create} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-heading px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent">
          + Ajouter un utilisateur
        </Link>
      </div>

      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Nom ou e-mail…' }}
        quick={fixedRole ? undefined : {
          key: 'role',
          allLabel: 'Tous',
          allCount: facets?.total,
          options: (facets?.roles ?? []).map((r: any) => ({ value: r.value, label: ROLE_LABEL[r.value] ?? r.value, count: r.count })),
        }}
        filters={filters}
        values={values}
        onChange={(patch) => { setValues((v) => ({ ...v, ...patch })); setPage(1); }}
        onReset={() => { setValues(EMPTY); setSearch(''); setSort('created_at:desc'); setPage(1); }}
        sort={{ value: sort, options: SORTS, onChange: (v) => { setSort(v); setPage(1); } }}
        resultLabel={loading ? 'Recherche…' : `${total} résultat${total > 1 ? 's' : ''}`}
      />

      {error ? (
        <ErrorMessage message={error.message} />
      ) : (
        <UserList
          customers={users}
          paginatorInfo={paginatorInfo}
          onPagination={setPage}
          onOrder={(col: string) => {
            if (!['created_at', 'name', 'orders_count'].includes(col)) return;
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
