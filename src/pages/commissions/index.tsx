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
}

const input = 'w-full rounded-md border border-border-200 px-3 py-2 text-sm focus:border-accent focus:outline-none';

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
    (t, p) => ({ orders: t.orders + p.orders_commission, kits: t.kits + p.kits_commission }), { orders: 0, kits: 0 },
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
                <th className="px-4 py-3 text-right font-semibold">Commissions</th>
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
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 text-heading">
              <tr>
                <td className="px-4 py-3" colSpan={4}><strong>Total ({data.points.length} points)</strong></td>
                <td className="px-4 py-3">{fcfa(totals.orders)}</td>
                <td className="px-4 py-3">{fcfa(totals.kits)}</td>
                <td className="px-4 py-3 text-right font-semibold">{fcfa(totals.orders + totals.kits)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </Card>
    </>
  );
}

CommissionsPage.authenticate = { permissions: adminOnly };
CommissionsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
