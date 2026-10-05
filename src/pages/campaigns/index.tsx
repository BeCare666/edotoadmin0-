import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall, CampaignStatus, downloadFile, fcfa, formatDate, STATUS_BADGE } from '@/components/campaign/campaign-api';

interface CampaignRow {
  id: number;
  title: string;
  status: CampaignStatus;
  cities: string[];
  date_start: string;
  date_end: string | null;
  sponsor_names: string | null;
  budget: number;
  objective_kits: number;
  registrations_count: number;
  picked_up_count: number;
}

const TABS: { key: '' | CampaignStatus; label: string }[] = [
  { key: '', label: 'Toutes' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'a_venir', label: 'À venir' },
  { key: 'terminee', label: 'Terminées' },
];

const EMPTY: FilterValues = { city: '', sponsor: '' };

const SORTS = [
  { value: 'date_desc', label: 'Début le plus récent' },
  { value: 'date_asc', label: 'Début le plus ancien' },
  { value: 'registrations', label: "Plus d'inscrits" },
  { value: 'budget', label: 'Budget le plus élevé' },
  { value: 'title', label: 'Titre A → Z' },
];

export default function CampaignsPage() {
  const [status, setStatus] = useState<'' | CampaignStatus>('');
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [sort, setSort] = useState('date_desc');
  const [facets, setFacets] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadFacets = useCallback(() => {
    apiCall('admin/campaigns/facets').then(setFacets).catch(() => setFacets(null));
  }, []);
  useEffect(() => {
    loadFacets();
  }, [loadFacets]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20', sort });
      if (status) qs.set('status', status);
      if (search) qs.set('search', search);
      Object.entries(values).forEach(([k, v]) => v && qs.set(k, v));
      const data = await apiCall(`admin/campaigns?${qs.toString()}`);
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

  const remove = async (c: CampaignRow) => {
    if (!window.confirm(`Supprimer la campagne « ${c.title} » ?`)) return;
    setBusyId(c.id);
    try {
      const res = await apiCall(`admin/campaigns/${c.id}`, { method: 'DELETE' });
      toast.success(res.message || 'Campagne supprimée.');
      await load();
      loadFacets();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      await downloadFile('admin/campaigns/export', 'campagnes.xlsx');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  const filters: FilterDef[] = useMemo(() => [
    { type: 'chips', key: 'city', label: 'Ville', options: (facets?.cities ?? []).map((c: any) => ({ value: c.value, label: c.value, count: c.count })) },
    { type: 'chips', key: 'sponsor', label: 'Sponsor', options: facets?.sponsors ?? [] },
  ], [facets]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Santé communautaire</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">Campagnes</h1>
          <p className="mt-1 text-sm text-body">Statut calculé à partir des dates de début et de fin (heure du Bénin).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportAll} disabled={exporting} className="rounded-2xl border border-border-200 bg-white px-5 py-3 text-sm font-semibold text-heading transition hover:border-heading disabled:opacity-50">
            {exporting ? 'Export…' : 'Excel global'}
          </button>
          <Link href="/campaigns/create" className="rounded-2xl bg-heading px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent">
            + Nouvelle campagne
          </Link>
        </div>
      </div>

      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Rechercher une campagne par titre…' }}
        quick={{
          key: 'status',
          allLabel: 'Toutes',
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
        onReset={() => { setValues(EMPTY); setStatus(''); setSearch(''); setSort('date_desc'); setPage(1); }}
        sort={{ value: sort, options: SORTS, onChange: (v) => { setSort(v); setPage(1); } }}
        resultLabel={loading ? 'Recherche…' : `${total} campagne${total > 1 ? 's' : ''}`}
      />


      <Card className="overflow-x-auto p-0">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-sm text-body">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-body">Aucune campagne ne correspond à ces filtres.</p>
        ) : (
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border-200 text-xs uppercase tracking-wider text-body">
              <tr>
                <th className="px-4 py-3 font-semibold">Campagne</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Ville(s)</th>
                <th className="px-4 py-3 font-semibold">Dates</th>
                <th className="px-4 py-3 font-semibold">Sponsors / budget</th>
                <th className="px-4 py-3 font-semibold">Kits fournis</th>
                <th className="px-4 py-3 font-semibold">Inscrits</th>
                <th className="px-4 py-3 font-semibold">Retirés</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const badge = STATUS_BADGE[c.status];
                return (
                  <tr key={c.id} className="border-b border-border-200 last:border-0">
                    <td className="px-4 py-3 font-medium text-heading">
                      <Link href={`/campaigns/${c.id}`} className="hover:text-accent hover:underline">{c.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge?.className ?? ''}`}>{badge?.label ?? c.status}</span>
                    </td>
                    <td className="px-4 py-3">{c.cities.join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-body">{formatDate(c.date_start)} → {formatDate(c.date_end)}</td>
                    <td className="px-4 py-3">
                      <div>{c.sponsor_names || '—'}</div>
                      <div className="text-xs text-body">{fcfa(c.budget)}</div>
                    </td>
                    <td className="px-4 py-3">{c.objective_kits}</td>
                    <td className="px-4 py-3">{c.registrations_count}</td>
                    <td className="px-4 py-3">{c.picked_up_count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/campaigns/${c.id}`} className="rounded-md border border-border-200 px-3 py-1.5 text-xs font-semibold text-heading hover:border-accent">Détail</Link>
                        <Link href={`/campaigns/${c.id}/edit`} className="rounded-md border border-border-200 px-3 py-1.5 text-xs font-semibold text-heading hover:border-accent">Modifier</Link>
                        <button
                          onClick={() => remove(c)}
                          disabled={busyId === c.id || c.registrations_count > 0}
                          title={c.registrations_count > 0 ? 'Suppression impossible : la campagne a des inscrits' : undefined}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Supprimer
                        </button>
                      </div>
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
          <span className="text-body">{total} campagnes</span>
          <button disabled={page <= 1} onClick={() => setPage((n) => n - 1)} className="rounded-md border border-border-200 px-3 py-1 disabled:opacity-40">Précédent</button>
          <span>{page} / {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage((n) => n + 1)} className="rounded-md border border-border-200 px-3 py-1 disabled:opacity-40">Suivant</button>
        </div>
      )}
    </>
  );
}

CampaignsPage.authenticate = { permissions: adminOnly };
CampaignsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
