import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Card from '@/components/common/card';
import { apiCall } from '@/components/campaign/campaign-api';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import StageTabs, { Stage } from '@/components/order/stage-tabs';

// Demandes de kit traitées comme des commandes (06/10/2026) :
//  /campaign-requests            → à traiter
//  /campaign-requests/processed  → traitées (kit emballé)
//  /campaign-requests/withdrawn  → retirées (kit remis)
// Filtres réels (API admin/campaign-requests/facets) ; ?campaign_id=… préfiltre une campagne.
export const KIT_STAGE_LINKS: Record<Stage, string> = { to_process: '/campaign-requests', processed: '/campaign-requests/processed', withdrawn: '/campaign-requests/withdrawn' };
export const KIT_STAGE_LABELS: Record<Stage, string> = { to_process: 'À traiter', processed: 'Traitées (emballées)', withdrawn: 'Retirées' };
const TITLES: Record<Stage, { title: string; sub: string; empty: string }> = {
  to_process: { title: 'Demandes de kit à traiter', sub: 'Kits à emballer : demandes non traitées et non retirées.', empty: 'Aucune demande à traiter.' },
  processed: { title: 'Kits traités', sub: 'Kits emballés, en attente de retrait au point.', empty: 'Aucun kit traité en attente de retrait.' },
  withdrawn: { title: 'Kits retirés', sub: 'Kits remis aux participantes : demandes terminées.', empty: 'Aucun kit retiré.' },
};
const EMPTY: FilterValues = { campaign_id: '', city: '', pickup_center: '', date_from: '', date_to: '' };
const SORTS = [
  { value: 'created_at:desc', label: 'Demandes récentes' },
  { value: 'created_at:asc', label: 'Demandes anciennes' },
  { value: 'processed_at:desc', label: 'Traitées récemment' },
  { value: 'picked_up_at:desc', label: 'Retirées récemment' },
  { value: 'name:asc', label: 'Nom (A → Z)' },
];
const dt = (v: any) => (v ? new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Non renseignée');

export default function KitRequestsBoard({ stage }: { stage: Stage }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at:desc');
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<any>(null);
  const [facets, setFacets] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // Campagne passée dans l'adresse (lien depuis la fiche d'une campagne)
  useEffect(() => {
    if (!router.isReady) return;
    const c = router.query.campaign_id;
    if (typeof c === 'string' && /^\d+$/.test(c)) setValues((v) => ({ ...v, campaign_id: c }));
    setReady(true);
  }, [router.isReady, router.query.campaign_id]);

  const qsFor = useCallback(
    (extra: Record<string, string> = {}) => {
      const qs = new URLSearchParams({ stage, ...extra });
      if (search) qs.set('search', search);
      Object.entries(values).forEach(([k, v]) => v && qs.set(k, v));
      return qs;
    },
    [stage, search, values],
  );

  useEffect(() => {
    if (!ready) return;
    apiCall(`admin/campaign-requests/facets?${qsFor().toString()}`).then(setFacets).catch(() => setFacets(null));
  }, [ready, qsFor, tick]);

  const load = useCallback(async () => {
    if (!ready) return;
    setError(null);
    try {
      setData(await apiCall(`admin/campaign-requests?${qsFor({ page: String(page), limit: '20', sort }).toString()}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [ready, qsFor, page, sort]);

  useEffect(() => {
    load();
  }, [load, tick]);

  const toggle = async (r: any, processed: boolean) => {
    setBusy(r.id);
    try {
      await apiCall(`admin/campaign-requests/${r.id}/${processed ? 'process' : 'unprocess'}`, { method: 'PATCH' });
      toast.success(processed ? `Kit de ${r.full_name} traité (emballé).` : `Traitement annulé : la demande de ${r.full_name} revient « à traiter ».`);
      setTick((n) => n + 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const filters: FilterDef[] = useMemo(() => [
    {
      type: 'select', key: 'campaign_id', label: 'Campagne', placeholder: 'Toutes les campagnes',
      options: (facets?.campaigns ?? []).map((c: any) => ({ value: String(c.id), label: c.title, count: c.count })),
    },
    {
      type: 'chips', key: 'city', label: 'Ville',
      options: (facets?.cities ?? []).map((c: any) => ({ value: c.value, label: c.label, count: c.count })),
    },
    {
      type: 'select', key: 'pickup_center', label: 'Point de retrait', placeholder: 'Tous les points',
      options: (facets?.pickup_points ?? []).map((p: any) => ({ value: p.id, label: p.name, count: p.count })),
    },
    { type: 'dates', key: 'period', label: 'Période de la demande (heure du Bénin)', fromKey: 'date_from', toKey: 'date_to' },
  ], [facets]);

  const head = TITLES[stage];
  const total = Number(data?.total ?? 0);
  const lastPage = data?.last_page || 1;
  const filtered = Boolean(search) || Object.values(values).some(Boolean);
  const campaignTitle = values.campaign_id ? facets?.campaigns?.find((c: any) => String(c.id) === values.campaign_id)?.title : null;
  const links = Object.fromEntries(
    Object.entries(KIT_STAGE_LINKS).map(([k, href]) => [k, values.campaign_id ? `${href}?campaign_id=${values.campaign_id}` : href]),
  ) as Record<Stage, string>;

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Campagnes</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">{head.title}</h1>
        <p className="mt-1 text-sm text-body">
          {head.sub}
          {campaignTitle && <> · campagne <Link href={`/campaigns/${values.campaign_id}`} className="font-semibold text-heading hover:text-accent">{campaignTitle}</Link></>}
        </p>
      </div>

      <StageTabs active={stage} counts={facets?.stages} links={links} labels={KIT_STAGE_LABELS} />

      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Nom ou e-mail de la participante…' }}
        filters={filters}
        values={values}
        onChange={(patch) => { setValues((v) => ({ ...v, ...patch })); setPage(1); }}
        onReset={() => { setValues(EMPTY); setSearch(''); setSort('created_at:desc'); setPage(1); }}
        sort={{ value: sort, options: SORTS, onChange: (v) => { setSort(v); setPage(1); } }}
        resultLabel={data ? `${total.toLocaleString('fr-FR')} demande${total > 1 ? 's' : ''}` : 'Recherche…'}
      />

      <Card className="overflow-x-auto p-0 md:p-0">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : !data ? (
          <p className="p-6 text-sm text-body">Chargement…</p>
        ) : data.data.length === 0 ? (
          <p className="p-10 text-center text-sm text-body">{filtered ? 'Aucune demande ne correspond à ces filtres.' : head.empty}</p>
        ) : (
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border-200 text-xs uppercase tracking-wider text-body">
              <tr>
                <th className="px-6 py-4 font-medium">Participante</th>
                <th className="px-6 py-4 font-medium">Campagne</th>
                <th className="px-6 py-4 font-medium">Ville</th>
                <th className="px-6 py-4 font-medium">Point de retrait</th>
                <th className="px-6 py-4 font-medium">Demandé le</th>
                <th className="px-6 py-4 font-medium">Code</th>
                <th className="px-6 py-4 font-medium">{stage === 'withdrawn' ? 'Retiré le' : stage === 'processed' ? 'Traité le' : 'Traitement'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-100">
              {data.data.map((r: any) => (
                <tr key={r.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-heading">{r.full_name}</div>
                    <div className="text-xs text-body">{r.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/campaigns/${r.campaign_id}`} className="text-heading hover:text-accent">{r.campaign_title}</Link>
                  </td>
                  <td className="px-6 py-4 text-body">{r.city || 'Non renseignée'}</td>
                  <td className="px-6 py-4 text-heading">{r.pickup_center_name || `Point ${r.pickup_center}`}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-body">{dt(r.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.picked_up ? 'bg-emerald-50 text-emerald-700' : r.otp_used ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.picked_up ? 'Kit remis' : r.otp_used ? 'Validé au point' : 'Envoyé par e-mail'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {stage === 'withdrawn' ? (
                      <span className="text-body">{dt(r.picked_up_at)}</span>
                    ) : stage === 'processed' ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-body">{dt(r.processed_at)}{r.processed_by_name ? ` · ${r.processed_by_name}` : ''}</span>
                        <button disabled={busy === r.id} onClick={() => toggle(r, false)} className="text-xs font-semibold text-body underline-offset-4 hover:text-heading hover:underline disabled:opacity-50">
                          Annuler le traitement
                        </button>
                      </div>
                    ) : ['order-cancelled', 'order-refunded', 'order-failed'].includes(r.order_status) ? (
                      <span className="text-xs text-body">Demande annulée</span>
                    ) : (
                      <button
                        disabled={busy === r.id}
                        onClick={() => toggle(r, true)}
                        className="rounded-full bg-heading px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-50"
                      >
                        {busy === r.id ? '…' : 'Traiter'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <span className="text-body">{total} demandes</span>
          <button disabled={page <= 1} onClick={() => setPage((n) => n - 1)} className="rounded-full border border-border-200 bg-white px-4 py-1.5 disabled:opacity-40">Précédent</button>
          <span>{page} / {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage((n) => n + 1)} className="rounded-full border border-border-200 bg-white px-4 py-1.5 disabled:opacity-40">Suivant</button>
        </div>
      )}
    </>
  );
}
