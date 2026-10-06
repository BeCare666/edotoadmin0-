import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly, getAuthCredentials } from '@/utils/auth-utils';

const CenterMap = dynamic(() => import('@/components/delivery/center-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-lg border border-border-200 text-sm text-body">
      Chargement de la carte…
    </div>
  ),
});

type Status = '' | 'to_assign' | 'in_progress' | 'delivered';

interface Delivery {
  order_id: number;
  tracking_number: string;
  customer_name: string;
  created_at: string;
  description: string;
  phone: string;
  lat: number;
  lng: number;
  distance_km: number;
  fee: number;
  total: number;
  courier_name: string | null;
  courier_phone: string | null;
  assigned_at: string | null;
  delivered_at: string | null;
  link_active: boolean;
  link_blocked: boolean;
  failed_attempts: number;
}

interface AssignResult {
  orderId: number;
  tracking: string;
  link: string;
  pin: string;
  whatsapp_url: string;
}

const API = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;

const TABS: { key: Status; label: string }[] = [
  { key: 'to_assign', label: 'À confier' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'delivered', label: 'Livrées' },
  { key: '', label: 'Toutes' },
];

const fcfa = (n: number) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR')} FCFA`;

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

function DeliverySettingsCard() {
  const [price, setPrice] = useState('');
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCall('admin/delivery/settings')
      .then((s) => {
        setPrice(s.price_per_km != null ? String(s.price_per_km) : '');
        if (s.center_lat != null && s.center_lng != null) {
          setCenter({ lat: Number(s.center_lat), lng: Number(s.center_lng) });
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    if (!center) {
      toast.error('Placez le centre de traitement sur la carte.');
      return;
    }
    setSaving(true);
    try {
      await apiCall('admin/delivery/settings', {
        method: 'PUT',
        body: JSON.stringify({
          price_per_km: Number(price),
          center_lat: center.lat,
          center_lng: center.lng,
        }),
      });
      toast.success('Réglages de livraison enregistrés.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <h2 className="mb-1 text-lg font-semibold text-heading">
        Réglages de la livraison
      </h2>
      <p className="mb-4 text-sm text-body">
        Prix payé par le client = distance par la route depuis le centre de
        traitement × prix au kilomètre. Un changement s'applique aux nouvelles
        commandes.
      </p>
      {!loaded ? (
        <p className="text-sm text-body">Chargement…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-heading" htmlFor="price-per-km">
              Prix au kilomètre (FCFA)
            </label>
            <input
              id="price-per-km"
              type="number"
              min={1}
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-md border border-border-200 px-3 py-2 text-sm"
            />
            <div className="text-sm">
              <span className="font-semibold text-heading">Centre de traitement :</span>{' '}
              {center ? (
                <span className="text-body">
                  {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
                </span>
              ) : (
                <span className="text-red-600">non placé</span>
              )}
            </div>
            <button
              onClick={save}
              disabled={saving || !price || !center}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
          <div className="md:col-span-2">
            <CenterMap value={center} onChange={setCenter} />
            <p className="mt-1 text-xs text-body">
              Cliquez sur la carte ou déplacez le repère pour placer le centre de
              traitement.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function AssignForm({
  delivery,
  onDone,
  onCancel,
}: {
  delivery: Delivery;
  onDone: (r: AssignResult) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(delivery.courier_name || '');
  const [phone, setPhone] = useState(delivery.courier_phone || '+229');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await apiCall(`admin/delivery/orders/${delivery.order_id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ courier_name: name, courier_phone: phone }),
      });
      onDone({ ...r, orderId: delivery.order_id, tracking: delivery.tracking_number });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 text-left">
      <input
        placeholder="Nom du zem"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        className="rounded-md border border-border-200 px-2 py-1.5 text-xs"
      />
      <input
        placeholder="+229 01 …"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-md border border-border-200 px-2 py-1.5 text-xs"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-2 py-1 text-xs text-body">
          Annuler
        </button>
        <button
          type="submit"
          disabled={busy || !name.trim() || phone.replace(/\D/g, '').length < 8}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? '…' : 'Générer le lien'}
        </button>
      </div>
    </form>
  );
}

export default function CustomDeliveriesPage() {
  const [status, setStatus] = useState<Status>('to_assign');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Delivery[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [result, setResult] = useState<AssignResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) qs.set('status', status);
      const data = await apiCall(`admin/delivery/orders?${qs.toString()}`);
      setRows(data.data || []);
      setLastPage(data.last_page || 1);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const action = async (d: Delivery, path: 'deactivate' | 'unblock') => {
    setBusyId(d.order_id);
    try {
      const res = await apiCall(`admin/delivery/orders/${d.order_id}/${path}`, {
        method: 'POST',
      });
      toast.success(res.message);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Lien copié.');
    } catch {
      toast.error('Copie impossible : sélectionnez le lien à la main.');
    }
  };

  return (
    <>
      <Card className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="md:w-1/2">
          <PageHeading title="Livraisons à domicile" />
          <p className="mt-1 text-sm text-body">
            Commandes payées livrées au lieu décrit par le client. Confiez chaque
            colis à un zem : il reçoit un lien sécurisé et vous lui donnez le code
            PIN de vive voix.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:ms-auto" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key || 'all'}
              role="tab"
              aria-selected={status === t.key}
              onClick={() => {
                setStatus(t.key);
                setPage(1);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                status === t.key
                  ? 'border-accent bg-accent text-white'
                  : 'border-border-200 bg-white text-heading hover:border-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <DeliverySettingsCard />

      {result && (
        <Card className="mb-8 border-2 border-accent">
          <h2 className="text-lg font-semibold text-heading">
            Lien créé pour la commande {result.tracking}
          </h2>
          <p className="mt-1 text-sm text-body">
            Le lien et le PIN ne sont affichés qu'une seule fois. Le lien ne
            fonctionnera que sur le premier téléphone qui l'ouvre.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase text-body">
                Code PIN (à dire au zem de vive voix)
              </div>
              <div className="mt-1 font-mono text-3xl tracking-[0.4em] text-heading">
                {result.pin}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={result.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-[#25D366] px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Envoyer par WhatsApp
              </a>
              <button
                onClick={() => copy(result.link)}
                className="rounded-md border border-border-200 px-4 py-2 text-sm font-semibold text-heading"
              >
                Copier le lien
              </button>
            </div>
          </div>
          <button onClick={() => setResult(null)} className="mt-4 text-sm text-body underline">
            J'ai transmis le lien et le PIN : fermer
          </button>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-sm text-body">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-body">Aucune livraison dans cette catégorie.</p>
        ) : (
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border-200 text-xs uppercase tracking-wider text-body">
              <tr>
                <th className="px-4 py-3 font-semibold">Commande</th>
                <th className="px-4 py-3 font-semibold">Lieu de livraison</th>
                <th className="px-4 py-3 font-semibold">Distance / frais</th>
                <th className="px-4 py-3 font-semibold">Zem</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const delivered = !!d.delivered_at;
                return (
                  <tr key={d.order_id} className="border-b border-border-200 align-top last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-heading">{d.tracking_number}</div>
                      <div className="text-xs text-body">{d.customer_name}</div>
                      <div className="text-xs text-body">
                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <div className="whitespace-pre-line">{d.description}</div>
                      <div className="text-xs text-body">Tél. client : {d.phone}</div>
                      <a
                        className="text-xs text-accent hover:underline"
                        href={`https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lng}#map=18/${d.lat}/${d.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Voir sur la carte
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div>{String(d.distance_km).replace('.', ',')} km</div>
                      <div className="text-xs text-body">{fcfa(d.fee)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {d.courier_name ? (
                        <>
                          <div className="font-medium text-heading">{d.courier_name}</div>
                          <div className="text-xs text-body">{d.courier_phone}</div>
                          <div className="mt-1 text-xs">
                            {delivered ? (
                              <span className="text-green-700">
                                Remis le {new Date(d.delivered_at as string).toLocaleString('fr-FR')}
                              </span>
                            ) : d.link_blocked ? (
                              <span className="text-red-600">Lien bloqué (5 codes faux)</span>
                            ) : d.link_active ? (
                              <span className="text-green-700">Lien actif</span>
                            ) : (
                              <span className="text-body">Lien désactivé</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-body">Aucun zem désigné</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!delivered && (
                        <div className="flex flex-col items-end gap-2">
                          {assigningId === d.order_id ? (
                            <AssignForm
                              delivery={d}
                              onCancel={() => setAssigningId(null)}
                              onDone={(r) => {
                                setAssigningId(null);
                                setResult(r);
                                load();
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => setAssigningId(d.order_id)}
                              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
                            >
                              {d.assigned_at ? 'Nouveau lien' : 'Confier à un zem'}
                            </button>
                          )}
                          {d.link_blocked && (
                            <button
                              onClick={() => action(d, 'unblock')}
                              disabled={busyId === d.order_id}
                              className="rounded-md border border-border-200 px-3 py-1.5 text-xs font-semibold text-heading hover:border-accent disabled:opacity-50"
                            >
                              Débloquer
                            </button>
                          )}
                          {d.link_active && (
                            <button
                              onClick={() => action(d, 'deactivate')}
                              disabled={busyId === d.order_id}
                              className="rounded-md border border-border-200 px-3 py-1.5 text-xs font-semibold text-heading hover:border-accent disabled:opacity-50"
                            >
                              Désactiver le lien
                            </button>
                          )}
                        </div>
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
          <span className="text-body">{total} livraisons</span>
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

CustomDeliveriesPage.authenticate = {
  permissions: adminOnly,
};
CustomDeliveriesPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
