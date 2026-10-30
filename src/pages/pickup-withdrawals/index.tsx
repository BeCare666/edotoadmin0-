import { useCallback, useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall, fcfa } from '@/components/campaign/campaign-api';

// Demandes de retrait des points de retrait (B7, 30/10/2026) : API /admin/withdrawals.
// Payer = l'admin a envoyé l'argent, il note la référence ; le versement est enregistré et la demande liée.
type Status = 'pending' | 'paid' | 'rejected' | 'cancelled';

interface Request {
  id: number;
  amount: number;
  method_label: string;
  account: string | null;
  note: string | null;
  status: Status;
  status_label: string;
  admin_note: string | null;
  created_at: string | null;
  decided_at: string | null;
  pickup_point: { id: number; name: string | null; address: string | null };
}

const TABS: { value: '' | Status; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payées' },
  { value: 'rejected', label: 'Refusées' },
  { value: 'cancelled', label: 'Annulées' },
  { value: '', label: 'Toutes' },
];

const TONE: Record<Status, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

const input = 'w-full rounded-md border border-border-200 px-3 py-2 text-sm focus:border-accent focus:outline-none';
const when = (d: string | null) => (d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

function DecisionModal({ request, mode, onClose, onDone }: { request: Request; mode: 'pay' | 'reject'; onClose: () => void; onDone: () => Promise<void> }) {
  const [form, setForm] = useState({ reference: '', paid_at: new Date().toISOString().slice(0, 10), admin_note: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ask = mode === 'pay'
      ? `Confirmer : vous avez envoyé ${fcfa(request.amount)} à ${request.pickup_point.name} ?`
      : `Refuser la demande de ${request.pickup_point.name} ?`;
    if (!window.confirm(ask)) return;
    setBusy(true);
    try {
      const res = await apiCall(`admin/withdrawals/${request.id}/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      toast.success(res.message);
      await onDone();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-light p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-heading">{mode === 'pay' ? 'Payer la demande' : 'Refuser la demande'}</h2>
        <p className="mt-2 text-sm text-body">
          {request.pickup_point.name} · <strong className="text-heading">{fcfa(request.amount)}</strong> · {request.method_label}
          {request.account && <> · {request.account}</>}
        </p>
        {request.note && <p className="mt-1 text-xs text-body">Note du point : {request.note}</p>}
        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === 'pay' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-body">Référence du paiement
                  <input type="text" maxLength={100} className={input} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="N° de transaction" />
                </label>
                <label className="text-sm text-body">Date du paiement
                  <input type="date" required max={new Date().toISOString().slice(0, 10)} className={input} value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })} />
                </label>
              </div>
              <label className="block text-sm text-body">Note (facultatif)
                <input type="text" maxLength={255} className={input} value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} />
              </label>
            </>
          ) : (
            <label className="block text-sm text-body">Motif du refus (visible par le point de retrait)
              <input type="text" required maxLength={255} className={input} value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} />
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-body hover:bg-gray-100">Annuler</button>
            <button type="submit" disabled={busy} className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${mode === 'pay' ? 'bg-accent hover:bg-accent-hover' : 'bg-red-600 hover:bg-red-700'}`}>
              {busy ? 'Enregistrement…' : mode === 'pay' ? 'Paiement envoyé' : 'Refuser'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PickupWithdrawalsPage() {
  const [status, setStatus] = useState<'' | Status>('pending');
  const [data, setData] = useState<{ data: Request[]; counts: Record<string, { n: number; amount: number }> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ request: Request; mode: 'pay' | 'reject' } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await apiCall(`admin/withdrawals${status ? `?status=${status}` : ''}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = data?.counts?.pending;
  return (
    <>
      <Card className="mb-8">
        <PageHeading title="Demandes de retrait" />
        <p className="mt-1 text-sm text-body">
          Les points de retrait demandent le retrait de leurs commissions. Envoyez l&apos;argent, puis notez le paiement : il est
          enregistré dans les versements et dans les transactions.
        </p>
        {pending && pending.n > 0 && (
          <p className="mt-3 text-sm text-heading"><strong>{pending.n}</strong> demande(s) en attente, <strong>{fcfa(pending.amount)}</strong> au total.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button key={tab.label} type="button" onClick={() => setStatus(tab.value)}
              className={`rounded-full border px-3 py-1 text-sm ${status === tab.value ? 'border-accent bg-accent/10 text-accent' : 'border-border-200 text-body hover:bg-gray-50'}`}>
              {tab.label}{tab.value && data?.counts?.[tab.value] ? ` (${data.counts[tab.value].n})` : ''}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !data ? (
          <p className="text-sm text-body">Chargement…</p>
        ) : data.data.length === 0 ? (
          <p className="text-sm text-body">Aucune demande.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-border-200 text-xs uppercase tracking-wider text-body">
                <tr>
                  <th className="px-4 py-3 font-semibold">Demandée le</th>
                  <th className="px-4 py-3 font-semibold">Point de retrait</th>
                  <th className="px-4 py-3 font-semibold">Payer par</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold">Montant</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((r) => (
                  <tr key={r.id} className="border-b border-border-200 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{when(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-heading">{r.pickup_point.name}</div>
                      {r.pickup_point.address && <div className="text-xs text-body">{r.pickup_point.address}</div>}
                      {r.note && <div className="text-xs text-body">Note : {r.note}</div>}
                    </td>
                    <td className="px-4 py-3">{r.method_label}{r.account && <span className="block text-xs text-body">{r.account}</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${TONE[r.status]}`}>{r.status_label}</span>
                      {r.admin_note && <span className="mt-1 block text-xs text-body">{r.admin_note}</span>}
                      {r.decided_at && <span className="block text-xs text-body">{when(r.decided_at)}</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-heading">{fcfa(r.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {r.status === 'pending' && (
                        <span className="inline-flex gap-2">
                          <button type="button" onClick={() => setDecision({ request: r, mode: 'pay' })} className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-hover">Payer</button>
                          <button type="button" onClick={() => setDecision({ request: r, mode: 'reject' })} className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">Refuser</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {decision && <DecisionModal request={decision.request} mode={decision.mode} onClose={() => setDecision(null)} onDone={load} />}
    </>
  );
}

PickupWithdrawalsPage.authenticate = { permissions: adminOnly };
PickupWithdrawalsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
