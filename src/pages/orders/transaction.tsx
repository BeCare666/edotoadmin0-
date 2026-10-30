import { useCallback, useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall, fcfa } from '@/components/campaign/campaign-api';

// Transactions (B6, 30/10/2026) : journal de l'argent réel (API GET /admin/transactions, lecture seule).
// Remplace la page du modèle d'origine, qui relisait la liste des commandes (taxe, remise : inexistants ici).
type Kind = 'payment' | 'attempt' | 'payout';

interface Tx {
  kind: Kind;
  id: number;
  at: string;
  amount: number | null;
  order_ref: string | null;
  reference: string | null;
  party: string | null;
  status: string;
  method_label: string;
  detail: string | null;
}

interface Result {
  data: Tx[];
  totals: { received: number; received_count: number; paid_out: number; paid_out_count: number; attempts_count: number };
  payouts_available: boolean;
  page: number;
  last_page: number;
  total: number;
}

const KIND: Record<Kind, { label: string; tone: string; sign: string }> = {
  payment: { label: 'Paiement reçu', tone: 'bg-green-100 text-green-800', sign: '+' },
  attempt: { label: 'Paiement non abouti', tone: 'bg-amber-100 text-amber-800', sign: '' },
  payout: { label: 'Versement à un point', tone: 'bg-blue-100 text-blue-800', sign: '' },
};

const STATUS: Record<string, string> = {
  'payment-success': 'Réussi',
  processing: 'En cours',
  failed: 'En échec',
  paid: 'Versé',
};

const input = 'rounded-md border border-border-200 px-3 py-2 text-sm focus:border-accent focus:outline-none';
const when = (at: string) => new Date(at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function TransactionsPage() {
  const [kind, setKind] = useState<'all' | Kind>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [kind, from, to, debounced]);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams({ kind, page: String(page) });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (debounced) params.set('q', debounced);
    try {
      setData(await apiCall(`admin/transactions?${params.toString()}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [kind, from, to, debounced, page]);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;
  return (
    <>
      <Card className="mb-8">
        <PageHeading title="Transactions" />
        <p className="mt-1 text-sm text-body">
          L&apos;argent réel : paiements FeexPay reçus, paiements arrivés mais pas aboutis (à vérifier), versements aux points de retrait.
        </p>
        {t && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-border-200 p-4">
              <p className="text-xs uppercase tracking-wider text-body">Reçu</p>
              <p className="mt-1 text-lg font-semibold text-heading">{fcfa(t.received)}</p>
              <p className="text-xs text-body">{t.received_count} paiement(s)</p>
            </div>
            <div className="rounded-md border border-border-200 p-4">
              <p className="text-xs uppercase tracking-wider text-body">Versé aux points de retrait</p>
              <p className="mt-1 text-lg font-semibold text-heading">{fcfa(t.paid_out)}</p>
              <p className="text-xs text-body">{data?.payouts_available ? `${t.paid_out_count} versement(s)` : 'Migration 024 pas encore lancée'}</p>
            </div>
            <div className="rounded-md border border-border-200 p-4">
              <p className="text-xs uppercase tracking-wider text-body">Paiements non aboutis</p>
              <p className="mt-1 text-lg font-semibold text-heading">{t.attempts_count}</p>
              <p className="text-xs text-body">À vérifier dans FeexPay</p>
            </div>
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="text-sm text-body">Type
            <select className={`${input} block`} value={kind} onChange={(e) => setKind(e.target.value as any)}>
              <option value="all">Tout</option>
              <option value="payment">Paiements reçus</option>
              <option value="attempt">Paiements non aboutis</option>
              <option value="payout">Versements aux points</option>
            </select>
          </label>
          <label className="text-sm text-body">Du
            <input type="date" className={`${input} block`} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="text-sm text-body">Au
            <input type="date" className={`${input} block`} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="min-w-[220px] flex-1 text-sm text-body">Recherche
            <input type="search" className={`${input} block w-full`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="N° de commande, référence, nom" />
          </label>
        </div>
      </Card>

      <Card>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !data ? (
          <p className="text-sm text-body">Chargement…</p>
        ) : data.data.length === 0 ? (
          <p className="text-sm text-body">Aucune transaction pour ces filtres.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-border-200 text-xs uppercase tracking-wider text-body">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Qui</th>
                  <th className="px-4 py-3 font-semibold">Commande</th>
                  <th className="px-4 py-3 font-semibold">Moyen et référence</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold">Montant</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((x) => (
                  <tr key={`${x.kind}-${x.id}`} className="border-b border-border-200 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{when(x.at)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${KIND[x.kind].tone}`}>{KIND[x.kind].label}</span></td>
                    <td className="px-4 py-3">{x.party || ''}</td>
                    <td className="px-4 py-3">{x.order_ref || ''}</td>
                    <td className="px-4 py-3">
                      {x.method_label}
                      {x.reference && <span className="block text-xs text-body">{x.reference}</span>}
                      {x.detail && <span className="block text-xs text-body">{x.detail}</span>}
                    </td>
                    <td className="px-4 py-3">{STATUS[x.status] ?? x.status}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-heading">
                      {x.amount === null ? '' : `${KIND[x.kind].sign}${fcfa(x.amount)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.last_page > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-border-200 px-3 py-1 disabled:opacity-50">Précédent</button>
            <span className="text-body">Page {data.page} sur {data.last_page} ({data.total})</span>
            <button type="button" disabled={page >= data.last_page} onClick={() => setPage(page + 1)} className="rounded-md border border-border-200 px-3 py-1 disabled:opacity-50">Suivant</button>
          </div>
        )}
      </Card>
    </>
  );
}

TransactionsPage.authenticate = { permissions: adminOnly };
TransactionsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
