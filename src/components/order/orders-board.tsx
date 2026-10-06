import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { toast } from 'react-toastify';
import Card from '@/components/common/card';
import { useExportOrderQuery } from '@/data/export';
import { apiCall, fcfa } from '@/components/campaign/campaign-api';
import OtpReveal, { otpState } from '@/components/order/otp-reveal';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import { DELIVERY_TYPE_LABEL, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@/components/order/order-labels';
import StageTabs, { Stage } from '@/components/order/stage-tabs';

// Liste des commandes par étape de suivi (06/10/2026) :
//  /orders            → à traiter (la liste générale : ce qu'il reste à préparer)
//  /orders/processed  → traitées (colis préparé par l'admin)
//  /orders/withdrawn  → retirées (terminées)
// Même liste, mêmes filtres réels qu'avant (point de retrait, code masqué, recherche, tri), + le bouton « Traiter ».
type Sort = 'created_at' | 'total';

const PAYMENT_BADGE: Record<string, string> = {
  'payment-success': 'bg-emerald-50 text-emerald-700',
  'payment-pending': 'bg-amber-50 text-amber-800',
  'payment-failed': 'bg-red-50 text-red-700',
};
const STATUS_BADGE: Record<string, string> = {
  'order-completed': 'bg-emerald-50 text-emerald-700',
  'order-processing': 'bg-sky-50 text-sky-700',
  'order-pending': 'bg-amber-50 text-amber-800',
  'order-cancelled': 'bg-gray-100 text-gray-600',
  'order-failed': 'bg-red-50 text-red-700',
  'order-refunded': 'bg-gray-100 text-gray-600',
};
const STOPPED = ['order-cancelled', 'order-refunded', 'order-failed'];

export const ORDER_STAGE_LINKS: Record<Stage, string> = { to_process: '/orders', processed: '/orders/processed', withdrawn: '/orders/withdrawn' };
export const ORDER_STAGE_LABELS: Record<Stage, string> = { to_process: 'À traiter', processed: 'Traitées', withdrawn: 'Retirées' };
const TITLES: Record<Stage, { title: string; sub: string; empty: string }> = {
  to_process: { title: 'Commandes à traiter', sub: 'Commandes non encore préparées et non retirées.', empty: 'Aucune commande à traiter.' },
  processed: { title: 'Commandes traitées', sub: 'Colis préparés, en attente de retrait.', empty: 'Aucune commande traitée en attente de retrait.' },
  withdrawn: { title: 'Commandes retirées', sub: 'Commandes retirées ou livrées : terminées.', empty: 'Aucune commande retirée.' },
};

function withdrawal(o: any) {
  if (o.delivery_type === 'CUSTOM') return { label: 'Livraison à domicile', tone: 'text-accent' };
  if (o.pickup_point_name) return { label: o.pickup_point_name, tone: 'text-heading' };
  return { label: 'Non choisi', tone: 'text-body' };
}

const EMPTY: FilterValues = {
  order_status: '', payment_status: '', delivery_type: '', kind: '', pickup_point_id: '',
  date_from: '', date_to: '', min_total: '', max_total: '',
};

const SORTS = [
  { value: 'created_at:desc', label: 'Plus récentes' },
  { value: 'created_at:asc', label: 'Plus anciennes' },
  { value: 'total:desc', label: 'Montant décroissant' },
  { value: 'total:asc', label: 'Montant croissant' },
  { value: 'updated_at:desc', label: 'Mises à jour récemment' },
];

const dt = (v: any) => (v ? new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Non renseignée');

export default function OrdersBoard({ stage }: { stage: Stage }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at:desc');
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [data, setData] = useState<any>(null);
  const [facets, setFacets] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const { refetch } = useExportOrderQuery({}, { enabled: false });
  const [orderBy, sortedBy] = sort.split(':') as [Sort, 'desc' | 'asc'];

  // Compteurs réels (périmètre admin, dans l'étape), rechargés avec la recherche
  useEffect(() => {
    const qs = new URLSearchParams({ stage });
    if (search) qs.set('search', search);
    apiCall(`orders/facets?${qs.toString()}`).then(setFacets).catch(() => setFacets(null));
  }, [search, stage, tick]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20', orderBy, sortedBy, stage });
      if (search) qs.set('search', search);
      Object.entries(values).forEach(([k, v]) => v && qs.set(k, v));
      setData(await apiCall(`orders?${qs.toString()}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [page, search, orderBy, sortedBy, values, stage]);

  useEffect(() => {
    load();
  }, [load, tick]);

  // Traiter (colis préparé) / annuler le traitement : la commande change de liste
  const toggle = async (o: any, processed: boolean) => {
    setBusy(o.id);
    try {
      await apiCall(`orders/${o.id}/${processed ? 'process' : 'unprocess'}`, { method: 'PATCH' });
      toast.success(processed ? `Commande ${o.tracking_number} traitée.` : `Traitement annulé : ${o.tracking_number} revient « à traiter ».`);
      setTick((n) => n + 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const sortBy = (col: Sort) => {
    setSort((prev) => {
      const [c, d] = prev.split(':');
      return `${col}:${c === col && d === 'desc' ? 'asc' : 'desc'}`;
    });
    setPage(1);
  };

  const filters: FilterDef[] = useMemo(() => [
    {
      type: 'chips', key: 'payment_status', label: 'Paiement',
      options: (facets?.payment_status ?? []).map((p: any) => ({ value: p.value, label: PAYMENT_STATUS_LABEL[p.value] ?? p.value, count: p.count })),
    },
    {
      type: 'chips', key: 'delivery_type', label: 'Mode de retrait',
      options: (facets?.delivery_type ?? []).map((p: any) => ({ value: p.value, label: DELIVERY_TYPE_LABEL[p.value] ?? p.value, count: p.count })),
    },
    {
      type: 'chips', key: 'kind', label: 'Origine de la commande',
      options: [
        { value: 'shop', label: 'Boutique', count: facets?.kind?.shop ?? 0 },
        { value: 'campaign', label: 'Kit de campagne', count: facets?.kind?.campaign ?? 0 },
      ],
    },
    {
      type: 'select', key: 'pickup_point_id', label: 'Point de retrait', placeholder: 'Tous les points',
      options: (facets?.pickup_points ?? []).map((p: any) => ({ value: p.id == null ? 'none' : String(p.id), label: p.id == null ? 'Aucun point choisi' : p.name ?? `Point #${p.id}`, count: p.count })),
    },
    { type: 'dates', key: 'period', label: 'Période de commande (heure du Bénin)', fromKey: 'date_from', toKey: 'date_to' },
    {
      type: 'range', key: 'amount', label: 'Montant total', minKey: 'min_total', maxKey: 'max_total', unit: 'FCFA',
      minHint: facets?.total_range?.min ?? null, maxHint: facets?.total_range?.max ?? null,
    },
  ], [facets]);

  async function handleExportOrder() {
    const { data: url } = await refetch();
    if (url) {
      const a = document.createElement('a');
      a.href = url as any;
      a.setAttribute('download', 'export-order');
      a.click();
    }
  }

  const arrow = (col: Sort) => (orderBy === col ? (sortedBy === 'desc' ? ' ↓' : ' ↑') : '');
  const lastPage = data?.last_page || 1;
  const total = Number(data?.total ?? 0);
  const filtered = Boolean(search) || Object.values(values).some(Boolean);
  const head = TITLES[stage];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Ventes</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">{head.title}</h1>
          <p className="mt-1 text-sm text-body">{head.sub}</p>
        </div>
        <button onClick={handleExportOrder} className="inline-flex items-center justify-center rounded-2xl border border-border-200 bg-white px-5 py-3 text-sm font-semibold text-heading transition hover:border-heading">
          {t('common:text-export-orders')}
        </button>
      </div>

      <StageTabs active={stage} counts={facets?.stages} links={ORDER_STAGE_LINKS} labels={ORDER_STAGE_LABELS} />

      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'N° de suivi, code, nom ou contact du client…' }}
        quick={{
          key: 'order_status',
          allLabel: 'Tous les statuts',
          allCount: facets?.total,
          options: (facets?.order_status ?? []).map((s: any) => ({ value: s.value, label: ORDER_STATUS_LABEL[s.value] ?? s.value, count: s.count })),
        }}
        filters={filters}
        values={values}
        onChange={(patch) => { setValues((v) => ({ ...v, ...patch })); setPage(1); }}
        onReset={() => { setValues(EMPTY); setSearch(''); setSort('created_at:desc'); setPage(1); }}
        sort={{ value: sort, options: SORTS, onChange: (v) => { setSort(v); setPage(1); } }}
        resultLabel={data ? `${total.toLocaleString('fr-FR')} résultat${total > 1 ? 's' : ''}` : 'Recherche…'}
      />

      <Card className="overflow-x-auto p-0 md:p-0">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : !data ? (
          <p className="p-6 text-sm text-body">{t('common:text-loading')}</p>
        ) : data.data.length === 0 ? (
          <p className="p-10 text-center text-sm text-body">{filtered ? 'Aucune commande ne correspond à ces filtres.' : head.empty}</p>
        ) : (
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="border-b border-border-200 text-xs uppercase tracking-wider text-body">
              <tr>
                <th className="px-6 py-4 font-medium">N° de suivi</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="cursor-pointer px-6 py-4 font-medium" onClick={() => sortBy('created_at')}>Date{arrow('created_at')}</th>
                <th className="px-6 py-4 font-medium">Retrait</th>
                <th className="px-6 py-4 font-medium">Code de retrait</th>
                <th className="cursor-pointer px-6 py-4 text-right font-medium" onClick={() => sortBy('total')}>Total{arrow('total')}</th>
                <th className="px-6 py-4 font-medium">Paiement</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">{stage === 'withdrawn' ? 'Retirée le' : stage === 'processed' ? 'Traitée le' : 'Traitement'}</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-100">
              {data.data.map((o: any) => {
                const w = withdrawal(o);
                const code = otpState(o);
                const paid = o.payment_status === 'payment-success';
                const stopped = STOPPED.includes(o.order_status);
                return (
                  <tr key={o.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-heading">
                      <Link href={`/orders/${o.id}`} className="hover:text-accent">{o.tracking_number}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-heading">{o.customer_display?.name || 'Client non renseigné'}</div>
                      <div className="text-xs text-body">{o.customer_display?.email || o.customer_contact || ''}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-body">{new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className={`px-6 py-4 ${w.tone}`}>{w.label}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <OtpReveal code={o.otp_code} compact />
                        {o.otp_code && <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${code.className}`}>{code.label}</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-heading">{fcfa(o.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PAYMENT_BADGE[o.payment_status] ?? 'bg-gray-100 text-gray-600'}`}>{PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[o.order_status] ?? 'bg-gray-100 text-gray-600'}`}>{ORDER_STATUS_LABEL[o.order_status] ?? o.order_status}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {stage === 'withdrawn' ? (
                        <span className="text-body">{dt(o.delivered_at)}</span>
                      ) : stage === 'processed' ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-body">{dt(o.processed_at)}</span>
                          <button disabled={busy === o.id} onClick={() => toggle(o, false)} className="text-xs font-semibold text-body underline-offset-4 hover:text-heading hover:underline disabled:opacity-50">
                            Annuler le traitement
                          </button>
                        </div>
                      ) : stopped ? (
                        <span className="text-xs text-body">Commande arrêtée</span>
                      ) : paid ? (
                        <button
                          disabled={busy === o.id}
                          onClick={() => toggle(o, true)}
                          className="rounded-full bg-heading px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-50"
                        >
                          {busy === o.id ? '…' : 'Traiter'}
                        </button>
                      ) : (
                        <span className="text-xs text-body" title="Une commande se traite une fois payée">Après paiement</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/orders/${o.id}`} className="rounded-full border border-border-200 px-3 py-1.5 text-xs font-semibold text-heading hover:border-accent hover:text-accent">Détail</Link>
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
          <span className="text-body">{data?.total} commandes</span>
          <button disabled={page <= 1} onClick={() => setPage((n) => n - 1)} className="rounded-full border border-border-200 bg-white px-4 py-1.5 disabled:opacity-40">Précédent</button>
          <span>{page} / {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage((n) => n + 1)} className="rounded-full border border-border-200 bg-white px-4 py-1.5 disabled:opacity-40">Suivant</button>
        </div>
      )}
    </>
  );
}
