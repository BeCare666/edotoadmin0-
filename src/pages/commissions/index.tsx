import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall, fcfa } from '@/components/campaign/campaign-api';

type Type = 'orders' | 'kits';

interface Point {
  id: number;
  name: string;
  email: string;
  pickup_address: string | null;
  status: 'active' | 'blocked';
  order_rate_percent: number;
  order_rate_is_custom: boolean;
  kit_amount: number;
  kit_amount_is_custom: boolean;
  orders_withdrawn: number;
  orders_commission: number;
  kits_withdrawn: number;
  kits_commission: number;
  paid_total: number;
  balance: number;
}

// Versements aux points de retrait (B7, 30/10/2026) : mêmes moyens que l'API (src/commissions/payouts.ts)
const PAYOUT_METHODS: Record<string, string> = { mobile_money: 'Mobile Money', cash: 'Espèces', bank: 'Virement bancaire' };

interface Payout {
  id: number;
  amount: number;
  method_label: string;
  reference: string | null;
  note: string | null;
  paid_at: string;
}

const input = 'w-full rounded-md border border-border-200 px-3 py-2 text-sm focus:border-accent focus:outline-none';

function PayoutModal({ point, onClose, onSaved }: { point: Point; onClose: () => void; onSaved: () => Promise<void> }) {
  const [info, setInfo] = useState<{ earned: number; paid: number; balance: number; payouts: Payout[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: '', method: 'mobile_money', reference: '', paid_at: new Date().toISOString().slice(0, 10), note: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiCall(`admin/commissions/payouts/${point.id}`);
      setInfo(res);
      setForm((f) => ({ ...f, amount: f.amount || String(res.balance || '') }));
    } catch (e: any) {
      setError(e.message);
    }
  }, [point.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`Noter un versement de ${fcfa(Number(form.amount))} à ${point.name} ?`)) return;
    setBusy(true);
    try {
      const res = await apiCall('admin/commissions/payouts', {
        method: 'POST',
        body: JSON.stringify({ pickup_point_id: point.id, amount: Number(form.amount), method: form.method, reference: form.reference, note: form.note, paid_at: form.paid_at }),
      });
      toast.success(res.message);
      setInfo(res);
      setForm((f) => ({ ...f, amount: String(res.balance || ''), reference: '', note: '' }));
      await onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-light p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-heading">Versements : {point.name}</h2>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {!info && !error && <p className="mt-3 text-sm text-body">Chargement…</p>}
        {info && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-body">Gagné</p><p className="font-semibold text-heading">{fcfa(info.earned)}</p></div>
              <div><p className="text-body">Versé</p><p className="font-semibold text-heading">{fcfa(info.paid)}</p></div>
              <div><p className="text-body">Reste à verser</p><p className="font-semibold text-accent">{fcfa(info.balance)}</p></div>
            </div>
            {info.balance > 0 ? (
              <form onSubmit={submit} className="mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm text-body">Montant (FCFA)
                    <input type="number" min={1} max={info.balance} step="1" required className={input} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </label>
                  <label className="text-sm text-body">Date du versement
                    <input type="date" required max={new Date().toISOString().slice(0, 10)} className={input} value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })} />
                  </label>
                  <label className="text-sm text-body">Moyen
                    <select className={input} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                      {Object.entries(PAYOUT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-body">Référence (facultatif)
                    <input type="text" maxLength={100} className={input} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="N° de transaction" />
                  </label>
                </div>
                <label className="block text-sm text-body">Note (facultatif)
                  <input type="text" maxLength={255} className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </label>
                <button type="submit" disabled={busy || !form.amount} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
                  {busy ? 'Enregistrement…' : 'Noter le versement'}
                </button>
              </form>
            ) : (
              <p className="mt-5 text-sm text-body">Rien à verser pour le moment.</p>
            )}
            <h3 className="mt-6 text-sm font-semibold text-heading">Versements déjà faits</h3>
            {info.payouts.length === 0 ? (
              <p className="mt-2 text-sm text-body">Aucun versement noté.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border-200 text-sm">
                {info.payouts.map((v) => (
                  <li key={v.id} className="flex justify-between gap-3 py-2">
                    <span>
                      {new Date(`${v.paid_at}T00:00:00`).toLocaleDateString('fr-FR')} · {v.method_label}
                      {v.reference && <span className="text-body"> · {v.reference}</span>}
                      {v.note && <span className="block text-xs text-body">{v.note}</span>}
                    </span>
                    <span className="font-semibold text-heading">{fcfa(v.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <div className="mt-6 text-right">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-body hover:bg-gray-100">Fermer</button>
        </div>
      </div>
    </div>
  );
}

function ApplyCard({
  type, title, unit, help, defaultValue, selectedCount, onApply,
}: {
  type: Type; title: string; unit: string; help: string; defaultValue: number; selectedCount: number;
  onApply: (type: Type, value: string, scope: 'all' | 'selected') => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = scope === 'all' ? 'tous les points de retrait (les valeurs particulières seront remplacées)' : `${selectedCount} point(s) coché(s)`;
    if (!window.confirm(`Appliquer ${value} ${unit} à ${target} ?`)) return;
    setBusy(true);
    try {
      await onApply(type, value, scope);
      setValue('');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <h2 className="text-base font-semibold text-heading">{title}</h2>
      <p className="mt-1 text-sm text-body">{help}</p>
      <p className="mt-3 text-sm text-heading">Valeur par défaut actuelle : <strong>{type === 'orders' ? `${defaultValue} %` : fcfa(defaultValue)}</strong></p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="number" min={0} max={type === 'orders' ? 100 : undefined} step={type === 'orders' ? '0.01' : '1'}
            className={input} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'orders' ? 'Ex. : 5' : 'Ex. : 500'}
            aria-label={title} required
          />
          <span className="shrink-0 text-sm text-body">{unit}</span>
        </div>
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name={`scope-${type}`} checked={scope === 'all'} onChange={() => setScope('all')} /> Tous les points de retrait</label>
          <label className="flex items-center gap-2"><input type="radio" name={`scope-${type}`} checked={scope === 'selected'} onChange={() => setScope('selected')} /> Points cochés ({selectedCount})</label>
        </fieldset>
        <button
          type="submit"
          disabled={busy || value === '' || (scope === 'selected' && selectedCount === 0)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? 'Application…' : 'Appliquer'}
        </button>
      </form>
    </Card>
  );
}

export default function CommissionsPage() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [data, setData] = useState<{ settings: { order_rate_percent: number; kit_amount: number }; points: Point[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [paying, setPaying] = useState<Point | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await apiCall(`admin/commissions${debounced ? `?q=${encodeURIComponent(debounced)}` : ''}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleIds = useMemo(() => (data?.points ?? []).map((p) => p.id), [data]);
  const allVisibleChecked = visibleIds.length > 0 && visibleIds.every((id) => checked.has(id));
  const toggle = (id: number) => setChecked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAllVisible = () => setChecked((prev) => {
    const next = new Set(prev);
    if (allVisibleChecked) visibleIds.forEach((id) => next.delete(id)); else visibleIds.forEach((id) => next.add(id));
    return next;
  });

  const apply = async (type: Type, value: string, scope: 'all' | 'selected') => {
    try {
      const res = await apiCall(`admin/commissions/${type}`, {
        method: 'PUT',
        body: JSON.stringify({ value: Number(value), scope, pickup_point_ids: Array.from(checked) }),
      });
      toast.success(res.message);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totals = useMemo(() => (data?.points ?? []).reduce(
    (t, p) => ({ orders: t.orders + p.orders_commission, kits: t.kits + p.kits_commission, paid: t.paid + (p.paid_total || 0), balance: t.balance + (p.balance || 0) }),
    { orders: 0, kits: 0, paid: 0, balance: 0 },
  ), [data]);

  return (
    <>
      <Card className="mb-8">
        <PageHeading title="Commissions des points de retrait" />
        <p className="mt-1 text-sm text-body">
          La commission est calculée et enregistrée au moment de chaque retrait, avec la valeur en vigueur :
          un changement ne modifie pas les commissions déjà enregistrées.
        </p>
      </Card>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <ApplyCard
          type="orders" title="Commandes : pourcentage" unit="%" help="Pourcentage du montant des produits de chaque commande retirée."
          defaultValue={data?.settings.order_rate_percent ?? 0} selectedCount={checked.size} onApply={apply}
        />
        <ApplyCard
          type="kits" title="Kits de campagne : prix par kit" unit="FCFA" help="Montant fixe pour chaque kit retiré."
          defaultValue={data?.settings.kit_amount ?? 0} selectedCount={checked.size} onApply={apply}
        />
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <input className={`${input} md:max-w-sm`} placeholder="Rechercher un point (nom, e-mail, adresse)…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un point de retrait" />
          <span className="text-sm text-body md:ms-auto">
            {checked.size} coché(s){checked.size > 0 && <button onClick={() => setChecked(new Set())} className="ms-2 text-accent hover:underline">Tout décocher</button>}
          </span>
        </div>
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : !data ? (
          <p className="p-6 text-sm text-body">Chargement…</p>
        ) : data.points.length === 0 ? (
          <p className="p-6 text-sm text-body">Aucun point de retrait.</p>
        ) : (
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-y border-border-200 text-xs uppercase tracking-wider text-body">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" checked={allVisibleChecked} onChange={toggleAllVisible} aria-label="Cocher tous les points affichés" /></th>
                <th className="px-4 py-3 font-semibold">Point de retrait</th>
                <th className="px-4 py-3 font-semibold">% commandes</th>
                <th className="px-4 py-3 font-semibold">Prix par kit</th>
                <th className="px-4 py-3 font-semibold">Commandes retirées</th>
                <th className="px-4 py-3 font-semibold">Kits retirés</th>
                <th className="px-4 py-3 text-right font-semibold">Gagné</th>
                <th className="px-4 py-3 text-right font-semibold">Versé</th>
                <th className="px-4 py-3 text-right font-semibold">Reste à verser</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.points.map((p) => (
                <tr key={p.id} className="border-b border-border-200 last:border-0">
                  <td className="px-4 py-3"><input type="checkbox" checked={checked.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Cocher ${p.name}`} /></td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-heading">{p.name}{p.status === 'blocked' && <span className="ms-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">Bloqué</span>}</div>
                    <div className="text-xs text-body">{p.pickup_address || p.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {p.order_rate_percent} %{p.order_rate_is_custom && <span className="ms-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">particulier</span>}
                  </td>
                  <td className="px-4 py-3">
                    {fcfa(p.kit_amount)}{p.kit_amount_is_custom && <span className="ms-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">particulier</span>}
                  </td>
                  <td className="px-4 py-3">{p.orders_withdrawn} · <span className="text-body">{fcfa(p.orders_commission)}</span></td>
                  <td className="px-4 py-3">{p.kits_withdrawn} · <span className="text-body">{fcfa(p.kits_commission)}</span></td>
                  <td className="px-4 py-3 text-right font-semibold text-heading">{fcfa(p.orders_commission + p.kits_commission)}</td>
                  <td className="px-4 py-3 text-right">{fcfa(p.paid_total || 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent">{fcfa(p.balance || 0)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setPaying(p)} className="rounded-md border border-accent px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/10">
                      Versements
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 text-heading">
              <tr>
                <td className="px-4 py-3" colSpan={4}><strong>Total ({data.points.length} points)</strong></td>
                <td className="px-4 py-3">{fcfa(totals.orders)}</td>
                <td className="px-4 py-3">{fcfa(totals.kits)}</td>
                <td className="px-4 py-3 text-right font-semibold">{fcfa(totals.orders + totals.kits)}</td>
                <td className="px-4 py-3 text-right">{fcfa(totals.paid)}</td>
                <td className="px-4 py-3 text-right font-semibold">{fcfa(totals.balance)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        )}
      </Card>
      {paying && <PayoutModal point={paying} onClose={() => setPaying(null)} onSaved={load} />}
    </>
  );
}

CommissionsPage.authenticate = { permissions: adminOnly };
CommissionsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
