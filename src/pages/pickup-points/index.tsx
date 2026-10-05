import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import { adminOnly, getAuthCredentials } from '@/utils/auth-utils';

type PickupStatus = 'pending' | 'active' | 'blocked';

interface PickupPoint {
  id: number;
  name: string;
  email: string;
  pickup_address: string | null;
  pickup_lat: string | null;
  pickup_lng: string | null;
  is_verified: number;
  status: PickupStatus;
  created_at: string;
  orders_count?: number;
}

const API = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;

const SORTS = [
  { value: 'default', label: 'En attente d’abord' },
  { value: 'recent', label: 'Inscrits récemment' },
  { value: 'oldest', label: 'Inscrits en premier' },
  { value: 'name', label: 'Nom A → Z' },
  { value: 'orders', label: 'Plus de commandes' },
];

const TABS: { key: '' | PickupStatus; label: string }[] = [
  { key: 'pending', label: 'En attente' },
  { key: 'active', label: 'Actifs' },
  { key: 'blocked', label: 'Bloqués' },
  { key: '', label: 'Tous' },
];

const STATUS_BADGE: Record<PickupStatus, { label: string; className: string }> =
  {
    pending: {
      label: 'En attente',
      className: 'bg-yellow-100 text-yellow-800',
    },
    active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
    blocked: { label: 'Bloqué', className: 'bg-gray-200 text-gray-700' },
  };

async function apiCall(path: string, init: RequestInit = {}) {
  const { token } = getAuthCredentials();
  const res = await fetch(`${API}/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message || 'Erreur serveur',
    );
  }
  return data;
}

export default function PickupPointsPage() {
  const [status, setStatus] = useState<'' | PickupStatus>('pending');
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>({ verified: '', located: '' });
  const [sort, setSort] = useState('default');
  const [facets, setFacets] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PickupPoint[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20', sort });
      if (status) qs.set('status', status);
      if (search) qs.set('search', search);
      Object.entries(values).forEach(([k, v]) => v && qs.set(k, v));
      const data = await apiCall(`admin/pickup-points?${qs.toString()}`);
      apiCall('admin/pickup-points/facets').then(setFacets).catch(() => setFacets(null));
      setRows(data.data || []);
      setLastPage(data.last_page || 1);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, page, search, values, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (point: PickupPoint) => {
    setBusyId(point.id);
    try {
      const res = await apiCall(`admin/pickup-points/${point.id}/approve`, {
        method: 'PATCH',
      });
      if (res.email_sent === false) {
        toast.warning(
          `${point.name} est validé, mais l'e-mail de notification n'a pas pu être envoyé.`,
        );
      } else {
        toast.success(`${point.name} est validé et prévenu par e-mail.`);
      }
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const resendVerification = async (point: PickupPoint) => {
    setBusyId(point.id);
    try {
      const res = await apiCall(
        `admin/pickup-points/${point.id}/resend-verification`,
        { method: 'POST' },
      );
      toast.success(res.message || 'Lien de confirmation renvoyé.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  // Blocage / déblocage : endpoints existants users/block-user et users/unblock-user
  const toggleBlock = async (point: PickupPoint) => {
    setBusyId(point.id);
    try {
      const path =
        point.status === 'blocked' ? 'users/unblock-user' : 'users/block-user';
      await apiCall(path, {
        method: 'POST',
        body: JSON.stringify({ id: point.id }),
      });
      toast.success(
        point.status === 'blocked'
          ? `${point.name} est débloqué.`
          : `${point.name} est bloqué.`,
      );
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const filters: FilterDef[] = useMemo(() => [
    { type: 'chips', key: 'verified', label: 'E-mail confirmé', options: [
      { value: '1', label: 'Confirmé', count: facets?.verified?.yes ?? 0 },
      { value: '0', label: 'Non confirmé', count: facets?.verified?.no ?? 0 },
    ] },
    { type: 'chips', key: 'located', label: 'Position GPS', options: [
      { value: '1', label: 'Renseignée', count: facets?.located?.yes ?? 0 },
      { value: '0', label: 'Manquante', count: facets?.located?.no ?? 0 },
    ] },
  ], [facets]);

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Réseau</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">Points de retrait</h1>
        <p className="mt-1 text-sm text-body">
          Un point inscrit doit confirmer son e-mail, puis être validé ici avant de pouvoir se connecter.
        </p>
      </div>

      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Nom, e-mail ou adresse du point…' }}
        quick={{
          key: 'status',
          allLabel: 'Tous',
          allCount: facets?.total,
          options: TABS.filter((t) => t.key).map((t) => ({ value: t.key, label: t.label, count: facets?.status?.[t.key] ?? 0 })),
        }}
        filters={filters}
        values={{ ...values, status }}
        onChange={(patch) => {
          if ('status' in patch) setStatus(patch.status as any);
          const { status: _s, ...rest } = patch;
          if (Object.keys(rest).length) setValues((v) => ({ ...v, ...rest }));
          setPage(1);
        }}
        onReset={() => { setValues({ verified: '', located: '' }); setStatus(''); setSearch(''); setSort('default'); setPage(1); }}
        sort={{ value: sort, options: SORTS, onChange: (v) => { setSort(v); setPage(1); } }}
        resultLabel={loading ? 'Recherche…' : `${total} point${total > 1 ? 's' : ''}`}
      />

      <Card className="overflow-x-auto p-0">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-sm text-body">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-body">
            Aucun point de retrait ne correspond à ces filtres.
          </p>
        ) : (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border-200 text-xs uppercase tracking-wider text-body">
              <tr>
                <th className="px-4 py-3 font-semibold">Point de retrait</th>
                <th className="px-4 py-3 font-semibold">Adresse / position</th>
                <th className="px-4 py-3 font-semibold">E-mail confirmé</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Commandes</th>
                <th className="px-4 py-3 font-semibold">Inscrit le</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const badge = STATUS_BADGE[p.status];
                const hasCoords =
                  p.pickup_lat !== null && p.pickup_lng !== null;
                const verified = Number(p.is_verified) === 1;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border-200 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-heading">{p.name}</div>
                      <div className="text-xs text-body">{p.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{p.pickup_address || '—'}</div>
                      {hasCoords ? (
                        <a
                          className="text-xs text-accent hover:underline"
                          href={`https://www.openstreetmap.org/?mlat=${p.pickup_lat}&mlon=${p.pickup_lng}#map=18/${p.pickup_lat}/${p.pickup_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {Number(p.pickup_lat).toFixed(5)},{' '}
                          {Number(p.pickup_lng).toFixed(5)}
                        </a>
                      ) : (
                        <div className="text-xs text-red-600">
                          Position non renseignée
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {verified ? (
                        <span className="text-green-700">Oui</span>
                      ) : (
                        <span className="text-yellow-700">Non</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-heading tabular-nums">{p.orders_count ?? 0}</td>
                    <td className="px-4 py-3 text-body">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          {!verified && (
                            <button
                              onClick={() => resendVerification(p)}
                              disabled={busyId === p.id}
                              className="rounded-md border border-border-200 px-3 py-1.5 text-xs font-semibold text-heading hover:border-accent disabled:opacity-50"
                            >
                              Renvoyer l'e-mail
                            </button>
                          )}
                          <button
                            onClick={() => approve(p)}
                            disabled={!verified || busyId === p.id}
                            title={
                              verified
                                ? undefined
                                : "L'e-mail doit d'abord être confirmé"
                            }
                            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busyId === p.id ? '…' : 'Valider'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleBlock(p)}
                          disabled={busyId === p.id}
                          className="rounded-md border border-border-200 px-3 py-1.5 text-xs font-semibold text-heading hover:border-accent disabled:opacity-50"
                        >
                          {busyId === p.id
                            ? '…'
                            : p.status === 'blocked'
                              ? 'Débloquer'
                              : 'Bloquer'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <span className="text-body">{total} points</span>
          <button
            disabled={page <= 1}
            onClick={() => setPage((n) => n - 1)}
            className="rounded-md border border-border-200 px-3 py-1 disabled:opacity-40"
          >
            Précédent
          </button>
          <span>
            {page} / {lastPage}
          </span>
          <button
            disabled={page >= lastPage}
            onClick={() => setPage((n) => n + 1)}
            className="rounded-md border border-border-200 px-3 py-1 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </>
  );
}

PickupPointsPage.authenticate = {
  permissions: adminOnly,
};
PickupPointsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
