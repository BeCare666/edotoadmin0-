import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Card from '@/components/common/card';
import { apiCall, fcfa } from '@/components/campaign/campaign-api';

// Remboursement d'une commande (B7, 30/10/2026) : API /admin/orders/:id/refund (super admin).
// Possible seulement pour une commande payée, pas encore retirée, pas déjà remboursée. L'argent est rendu par
// l'admin lui-même ; ici on note le remboursement (la commande passe « remboursée », son code de retrait est annulé).
const METHODS: Record<string, string> = { mobile_money: 'Mobile Money', bank: 'Virement bancaire', cash: 'Espèces' };
const input = 'w-full rounded-md border border-border-200 px-3 py-2 text-sm focus:border-accent focus:outline-none';

interface Refund { amount: number; method_label: string; reference: string | null; reason: string; refunded_at: string }

export default function RefundCard({ order, onDone }: { order: any; onDone: () => void }) {
  const [refund, setRefund] = useState<Refund | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const paidTotal = Number(order?.paid_total ?? order?.total) || 0;
  const [form, setForm] = useState({ amount: String(paidTotal || ''), method: 'mobile_money', reference: '', reason: '', refunded_at: new Date().toISOString().slice(0, 10) });

  const load = useCallback(async () => {
    if (!order?.id) return;
    try {
      const res = await apiCall(`admin/orders/${order.id}/refund`);
      setRefund(res.refund);
    } catch {
      setRefund(null);
    }
  }, [order?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const withdrawn = Number(order?.otp_used) === 1 || order?.order_status === 'order-completed';
  const eligible = order?.payment_status === 'payment-success' && !withdrawn && order?.order_status !== 'order-refunded' && paidTotal > 0;
  if (refund === undefined) return null;
  if (!refund && !eligible) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`Confirmer : vous avez rendu ${fcfa(Number(form.amount))} au client ? La commande passera « remboursée » et son code de retrait sera annulé.`)) return;
    setBusy(true);
    try {
      const res = await apiCall(`admin/orders/${order.id}/refund`, { method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
      toast.success(res.message);
      setRefund(res.refund);
      setOpen(false);
      onDone();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="edoto-serif text-xl font-semibold text-[#1A1814]">Remboursement</h2>
        {!refund && !open && (
          <button type="button" onClick={() => setOpen(true)} className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
            Rembourser la commande
          </button>
        )}
      </div>
      {refund ? (
        <p className="mt-3 text-sm text-[#57524B]">
          <strong className="text-[#1A1814]">{fcfa(refund.amount)}</strong> rendus le {new Date(`${refund.refunded_at}T00:00:00`).toLocaleDateString('fr-FR')} par {refund.method_label}
          {refund.reference && <> · réf. {refund.reference}</>}. Motif : {refund.reason}
        </p>
      ) : !open ? (
        <p className="mt-2 text-sm text-[#8A837A]">Commande payée et pas encore retirée : elle peut être remboursée.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm text-body">Montant rendu (FCFA)
              <input type="number" min={1} max={paidTotal} step="1" required className={input} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </label>
            <label className="text-sm text-body">Moyen
              <select className={input} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="text-sm text-body">Date
              <input type="date" required max={new Date().toISOString().slice(0, 10)} className={input} value={form.refunded_at} onChange={(e) => setForm({ ...form, refunded_at: e.target.value })} />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm text-body">Référence (facultatif)
              <input type="text" maxLength={100} className={input} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="N° de transaction" />
            </label>
            <label className="text-sm text-body">Motif
              <input type="text" required maxLength={255} className={input} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {busy ? 'Enregistrement…' : 'Noter le remboursement'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm text-body hover:bg-gray-100">Annuler</button>
          </div>
        </form>
      )}
    </Card>
  );
}
