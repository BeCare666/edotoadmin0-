import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall, fcfa, formatDate } from '@/components/campaign/campaign-api';

// Demandes de campagne des sponsors (15/10/2026) :
// en attente → validée (ou refusée avec motif) → « Créer la campagne » (formulaire prérempli) → campagne créée.
type Status = 'pending' | 'approved' | 'rejected' | 'created';
const BADGE: Record<Status, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-800' },
  approved: { label: 'Validée, campagne à créer', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Refusée', className: 'bg-red-50 text-red-700' },
  created: { label: 'Campagne créée', className: 'bg-[#FBEEF3] text-[#C2185B]' },
};
const SORTS = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'oldest', label: 'Plus anciennes' },
  { value: 'start', label: 'Date de début' },
  { value: 'kits', label: 'Plus de kits' },
  { value: 'budget', label: 'Budget le plus élevé' },
];
const EMPTY: FilterValues = { status: '', city: '', sponsor: '', from: '', to: '' };
const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Non renseignée');

function Detail({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const [p, setP] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'' | 'approve' | 'reject'>('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    apiCall(`admin/campaign-proposals/${id}`).then(setP).catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    setP(null);
    setMode('');
    setText('');
    load();
  }, [load]);

  const decide = async () => {
    setBusy(true);
    try {
      const res = await apiCall(`admin/campaign-proposals/${id}/${mode}`, {
        method: 'POST',
        body: JSON.stringify(mode === 'approve' ? { note: text } : { reason: text }),
      });
      if (res.email_sent === false) toast.warning(`${res.message} L'e-mail au sponsor n'a pas pu être envoyé.`);
      else toast.success(`${res.message} Le sponsor est prévenu.`);
      setMode('');
      setText('');
      load();
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Demande de campagne">
      <button className="absolute inset-0 bg-[#1A1814]/40" onClick={onClose} aria-label="Fermer" />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-200 bg-white px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Demande n° {id}</p>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm text-body hover:bg-gray-100">Fermer</button>
        </div>
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : !p ? (
          <p className="p-6 text-sm text-body">Chargement…</p>
        ) : (
          <div className="space-y-6 p-6">
            <div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[p.status as Status].className}`}>{BADGE[p.status as Status].label}</span>
              <h2 className="mt-3 font-serif text-2xl font-semibold text-heading">{p.title}</h2>
              <p className="mt-1 text-sm text-body">Reçue le {dt(p.created_at)}</p>
            </div>

            <div className="rounded-2xl border border-border-200 p-4 text-sm">
              <p className="text-xs uppercase tracking-wider text-body">Sponsor</p>
              <p className="mt-1 font-semibold text-heading">{p.sponsor_name}</p>
              <p className="text-body">{p.sponsor_contact || 'Contact non renseigné'}{p.sponsor_phone ? ` · ${p.sponsor_phone}` : ''}</p>
              <p className="text-body break-all">{p.sponsor_email}</p>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-body">Début souhaité</dt><dd className="font-medium text-heading">{formatDate(p.date_start)}</dd></div>
              <div><dt className="text-xs text-body">Fin souhaitée</dt><dd className="font-medium text-heading">{formatDate(p.date_end)}</dd></div>
              <div><dt className="text-xs text-body">Kits</dt><dd className="font-medium text-heading">{Number(p.objective_kits).toLocaleString('fr-FR')}</dd></div>
              <div><dt className="text-xs text-body">Budget proposé</dt><dd className="font-medium text-heading">{p.budget ? fcfa(p.budget) : 'Non renseigné'}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-body">Villes</dt><dd className="font-medium text-heading">{p.cities.join(', ')}</dd></div>
            </dl>
            {p.description && (
              <div>
                <p className="text-xs text-body">Description et objectifs</p>
                <p className="mt-1 whitespace-pre-line text-sm text-heading">{p.description}</p>
              </div>
            )}

            {p.decided_at && (
              <div className={`rounded-2xl p-4 text-sm ${p.status === 'rejected' ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-heading'}`}>
                <p>Décision le {dt(p.decided_at)}{p.decided_by_name ? ` par ${p.decided_by_name}` : ''}</p>
                {p.admin_note && <p className="mt-1 whitespace-pre-line">{p.status === 'rejected' ? 'Motif' : 'Message'} : {p.admin_note}</p>}
              </div>
            )}

            {p.status === 'pending' && (
              mode ? (
                <div className="space-y-3 rounded-2xl border border-border-200 p-4">
                  <label className="block text-sm font-semibold text-heading" htmlFor="decision-text">
                    {mode === 'approve' ? 'Message au sponsor (facultatif)' : 'Motif du refus (obligatoire)'}
                  </label>
                  <textarea id="decision-text" rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-xl border border-border-200 px-3 py-2 text-sm" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setMode(''); setText(''); }} className="px-3 text-sm text-body">Annuler</button>
                    <button onClick={decide} disabled={busy || (mode === 'reject' && !text.trim())}
                      className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${mode === 'approve' ? 'bg-accent hover:bg-accent-hover' : 'bg-red-600'}`}>
                      {mode === 'approve' ? 'Valider la demande' : 'Refuser la demande'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setMode('approve')} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover">Valider</button>
                  <button onClick={() => setMode('reject')} className="rounded-full border border-border-200 px-5 py-2.5 text-sm font-semibold text-heading hover:border-accent">Refuser</button>
                </div>
              )
            )}
            {p.status === 'approved' && (
              <Link href={`/campaigns/create?proposal=${p.id}`} className="inline-flex rounded-2xl bg-heading px-5 py-3 text-sm font-semibold text-white hover:bg-accent">
                Créer la campagne à partir de cette demande
              </Link>
            )}
            {p.status === 'created' && p.campaign_id && (
              <Link href={`/campaigns/${p.campaign_id}`} className="inline-flex rounded-2xl border border-border-200 px-5 py-3 text-sm font-semibold text-heading hover:border-accent">
                Voir la campagne « {p.campaign_title} »
              </Link>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

export default function CampaignProposalsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [facets, setFacets] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const openId = Number(router.query.id) || null;

  // Lien depuis la page Sponsors : ?sponsor=ID filtre la liste sur ce sponsor
  useEffect(() => {
    if (router.isReady && router.query.sponsor) setValues((v) => ({ ...v, sponsor: String(router.query.sponsor) }));
  }, [router.isReady, router.query.sponsor]);

  const loadFacets = useCallback(() => {
    apiCall('admin/campaign-proposals/facets').then(setFacets).catch(() => setFacets(null));
  }, []);
  useEffect(() => { loadFacets(); }, [loadFacets]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20', sort });
      if (search) qs.set('q', search);
      Object.entries(values).forEach(([k, v]) => v && qs.set(k, v));
      setData(await apiCall(`admin/campaign-proposals?${qs.toString()}`));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, values]);
  useEffect(() => { load(); }, [load]);

  const open = (id: number | null) => router.replace({ pathname: router.pathname, query: id ? { id } : {} }, undefined, { shallow: true });

  const filters: FilterDef[] = useMemo(() => [
    { type: 'chips', key: 'city', label: 'Ville', options: facets?.cities ?? [] },
    { type: 'select', key: 'sponsor', label: 'Sponsor', options: facets?.sponsors ?? [], placeholder: 'Tous les sponsors' },
    { type: 'dates', key: 'period', label: 'Début souhaité', fromKey: 'from', toKey: 'to' },
  ], [facets]);

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Espace sponsor</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-heading">Demandes de campagne</h1>
        <p className="mt-1 text-sm text-body">Les sponsors inscrits proposent une campagne : validez ou refusez, puis créez la campagne à partir de la demande validée.</p>
      </div>

      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Rechercher par campagne ou sponsor…' }}
        quick={{
          key: 'status',
          allLabel: 'Toutes',
          allCount: facets?.total,
          options: (facets?.statuses ?? []).map((s: any) => ({ value: s.value, label: s.value === 'approved' ? 'Validées, à créer' : s.label, count: s.count })),
        }}
        filters={filters}
        values={values}
        onChange={(patch) => { setValues((v) => ({ ...v, ...patch })); setPage(1); }}
        onReset={() => { setValues(EMPTY); setSearch(''); setSort('recent'); setPage(1); }}
        sort={{ value: sort, options: SORTS, onChange: (v) => { setSort(v); setPage(1); } }}
        resultLabel={loading ? 'Recherche…' : `${total} demande${total > 1 ? 's' : ''}`}
      />

      <Card className="overflow-x-auto p-0">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : loading && !data ? (
          <p className="p-6 text-sm text-body">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-body">{facets?.total ? 'Aucune demande ne correspond à ces filtres.' : 'Aucune demande de campagne pour le moment.'}</p>
        ) : (
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-border-200 text-xs uppercase tracking-wider text-body">
              <tr>
                <th className="px-5 py-4 font-semibold">Campagne proposée</th>
                <th className="px-5 py-4 font-semibold">Sponsor</th>
                <th className="px-5 py-4 font-semibold">Période souhaitée</th>
                <th className="px-5 py-4 font-semibold">Kits / budget</th>
                <th className="px-5 py-4 font-semibold">Reçue le</th>
                <th className="px-5 py-4 font-semibold">État</th>
                <th className="px-5 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-100">
              {rows.map((p: any) => (
                <tr key={p.id} className="cursor-pointer align-top hover:bg-gray-50" onClick={() => open(p.id)}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-heading">{p.title}</p>
                    <p className="text-xs text-body">{p.cities.join(', ')}</p>
                  </td>
                  <td className="px-5 py-4"><p className="text-heading">{p.sponsor_name}</p><p className="text-xs text-body">{p.sponsor_contact || p.sponsor_email}</p></td>
                  <td className="px-5 py-4 text-body">{formatDate(p.date_start)} → {formatDate(p.date_end)}</td>
                  <td className="px-5 py-4"><p>{Number(p.objective_kits).toLocaleString('fr-FR')} kits</p><p className="text-xs text-body">{p.budget ? fcfa(p.budget) : 'Budget non renseigné'}</p></td>
                  <td className="px-5 py-4 text-body">{dt(p.created_at)}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[p.status as Status].className}`}>{BADGE[p.status as Status].label}</span></td>
                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {p.status === 'approved' ? (
                      <Link href={`/campaigns/create?proposal=${p.id}`} className="rounded-full bg-heading px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent">Créer la campagne</Link>
                    ) : p.status === 'created' && p.campaign_id ? (
                      <Link href={`/campaigns/${p.campaign_id}`} className="text-xs font-semibold text-accent hover:underline">Voir la campagne</Link>
                    ) : (
                      <button onClick={() => open(p.id)} className="rounded-full border border-border-200 px-4 py-1.5 text-xs font-semibold text-heading hover:border-accent">{p.status === 'pending' ? 'Étudier' : 'Ouvrir'}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-border-200 px-5 py-4 text-sm">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-heading disabled:opacity-30">Précédent</button>
            <span className="text-body">Page {page} sur {data.last_page}</span>
            <button disabled={page >= data.last_page} onClick={() => setPage(page + 1)} className="text-heading disabled:opacity-30">Suivant</button>
          </div>
        )}
      </Card>

      {openId && <Detail id={openId} onClose={() => open(null)} onChanged={() => { load(); loadFacets(); }} />}
    </>
  );
}

CampaignProposalsPage.authenticate = { permissions: adminOnly };
CampaignProposalsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
