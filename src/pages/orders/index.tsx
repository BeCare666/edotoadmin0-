import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import { useExportOrderQuery } from '@/data/export';
import { apiCall, fcfa } from '@/components/campaign/campaign-api';
import OtpReveal, { otpState } from '@/components/order/otp-reveal';

// Liste des commandes (nouveau visuel E·Doto + G2 : point de retrait et code masqué).
// Recherche envoyée telle quelle à l'API (l'ancienne liste envoyait « tracking_number:… », jamais trouvé).
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

function withdrawal(o: any) {
  if (o.delivery_type === 'CUSTOM') return { label: 'Livraison à domicile', tone: 'text-accent' };
  if (o.pickup_point_name) return { label: o.pickup_point_name, tone: 'text-heading' };
  return { label: 'Non choisi', tone: 'text-body' };
}

export default function Orders() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<Sort>('created_at');
  const [sortedBy, setSortedBy] = useState<'desc' | 'asc'>('desc');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { refetch } = useExportOrderQuery({}, { enabled: false });

  useEffect(() => {
    const tm = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(tm);
  }, [searchInput]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20', orderBy, sortedBy });
      if (search) qs.set('search', search);
      setData(await apiCall(`orders?${qs.toString()}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [page, search, orderBy, sortedBy]);

  useEffect(() => {
    load();
  }, [load]);

  const sortBy = (col: Sort) => {
    if (orderBy === col) setSortedBy((s) => (s === 'desc' ? 'asc' : 'desc'));
    else {
      setOrderBy(col);
      setSortedBy('desc');
    }
    setPage(1);
  };

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

  return (
    <>
      <Card className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="md:w-1/3">
          <PageHeading title={t('form:input-label-orders')} />
          <p className="mt-1 text-sm text-body">Point de retrait et code de retrait de chaque commande.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:ms-auto md:w-auto">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="N° de suivi, code, contact…"
            aria-label="Rechercher une commande"
            className="w-full rounded-2xl border border-border-200 bg-white px-4 py-2.5 text-sm focus:border-accent focus:outline-none sm:w-80"
          />
          <button onClick={handleExportOrder} className="shrink-0 rounded-2xl border border-border-200 bg-white px-4 py-2.5 text-sm font-semibold text-heading hover:border-accent">
            {t('common:text-export-orders')}
          </button>
        </div>
      </Card>

      <Card className="overflow-x-auto p-0 md:p-0">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : !data ? (
          <p className="p-6 text-sm text-body">{t('common:text-loading')}</p>
        ) : data.data.length === 0 ? (
          <p className="p-10 text-center text-sm text-body">{search ? `Aucune commande pour « ${search} ».` : 'Aucune commande.'}</p>
        ) : (
          <table className="w-full min-w-[1100px] text-left text-sm">
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
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-100">
              {data.data.map((o: any) => {
                const w = withdrawal(o);
                const code = otpState(o);
                return (
                  <tr key={o.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-heading">
                      <Link href={`/orders/${o.id}`} className="hover:text-accent">{o.tracking_number}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-heading">{o.customer_display?.name || '—'}</div>
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
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PAYMENT_BADGE[o.payment_status] ?? 'bg-gray-100 text-gray-600'}`}>{t(o.payment_status)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[o.order_status] ?? 'bg-gray-100 text-gray-600'}`}>{t(o.order_status)}</span>
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

Orders.authenticate = {
  permissions: adminOnly,
};
Orders.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
