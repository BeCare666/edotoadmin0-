import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import { apiCall } from '@/components/campaign/campaign-api';
import { adminOnly } from '@/utils/auth-utils';
import { Field, Modal, PageHead, Pill, Stat, inputClass, when } from '@/components/teleconsultation/tc-ui';
import { siteImage } from '@/components/contraception/contra-ui';

// Demandes d'adoption des contraceptifs (21/10/2026) : étape 2 (accepter ou refuser), puis suivi des 7 étapes.
// Méthode sans médecin : le centre est choisi à l'acceptation, le jeune reçoit son code QR.
const EMPTY: FilterValues = { status: '', method_id: '', doctor: '' };
const TONE: Record<string, string> = {
  pending: 'wait', accepted: 'info', meeting: 'info', center: 'info', followup: 'ok',
  refused: 'stop', not_adopted: 'stop', not_done: 'stop', cancelled: 'neutral',
};
const STEP_COLOR: Record<string, string> = { done: 'bg-[#1A1814]', current: 'bg-[#C2185B]', failed: 'bg-[#9B2C2C]', skipped: 'bg-[#E9E5DF] opacity-50', todo: 'bg-[#E9E5DF]' };

function StepsBar({ steps }: { steps: any[] }) {
  return (
    <div className="flex gap-1" title={steps.map((s) => `${s.n}. ${s.label}`).join(' · ')}>
      {steps.map((s) => <span key={s.n} className={`h-1.5 flex-1 rounded-full ${STEP_COLOR[s.state]}`} />)}
    </div>
  );
}

function StepsList({ steps }: { steps: any[] }) {
  const label: Record<string, string> = { done: 'Faite', current: 'En cours', failed: 'Arrêtée', skipped: 'Sans objet (sans médecin)', todo: 'À venir' };
  return (
    <ol className="space-y-2">
      {steps.map((s) => (
        <li key={s.n} className="flex items-center gap-3 text-sm">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${s.state === 'done' ? 'bg-[#1A1814] text-white' : s.state === 'current' ? 'border-2 border-[#C2185B] text-[#C2185B]' : s.state === 'failed' ? 'bg-[#9B2C2C] text-white' : 'border border-[#E9E5DF] text-[#8A837A]'}`}>{s.n}</span>
          <span className={`flex-1 ${s.state === 'skipped' ? 'text-[#B3ABA1] line-through' : 'text-[#1A1814]'}`}>{s.label}</span>
          <span className="text-xs text-[#8A837A]">{label[s.state]}{s.date ? ` · ${when(s.date, false)}` : ''}</span>
        </li>
      ))}
    </ol>
  );
}

export default function ContraceptionRequests() {
  const [data, setData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState({ note: '', center_id: '', reason: '', followup: '' });
  const [busy, setBusy] = useState<string | null>(null);
  // Décision en cours dans les détails : accepter (raison facultative) ou refuser (raison obligatoire)
  const [decision, setDecision] = useState<'accept' | 'refuse' | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      Object.entries(values).forEach(([k, v]) => v && q.set(k, v));
      const [d, s] = await Promise.all([apiCall(`admin/contraception/requests?${q.toString()}`), apiCall('admin/contraception/summary')]);
      setData(d);
      setSummary(s);
    } catch (e: any) {
      setError(e.message);
    }
  }, [search, values]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const open = async (id: number) => {
    setForm({ note: '', center_id: '', reason: '', followup: '' });
    setDecision(null);
    try {
      setDetail(await apiCall(`admin/contraception/requests/${id}`));
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const act = async (key: string, path: string, body: any) => {
    setBusy(key);
    try {
      const res = await apiCall(`admin/contraception/requests/${detail.id}/${path}`, { method: 'POST', body: JSON.stringify(body) });
      toast.success(res.message);
      await Promise.all([load(), open(detail.id)]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const filters: FilterDef[] = useMemo(
    () => [
      { type: 'select', key: 'method_id', label: 'Contraceptif', placeholder: 'Tous les contraceptifs', options: data?.facets?.methods ?? [] },
      { type: 'chips', key: 'doctor', label: 'Accompagnement', options: [{ value: 'yes', label: 'Avec un médecin' }, { value: 'no', label: 'Sans médecin' }] },
    ],
    [data],
  );
  const rows = data?.data ?? [];

  return (
    <>
      <PageHead
        eyebrow="Contraception"
        title="Demandes d’adoption"
        subtitle="Chaque demande suit 7 étapes : demande, acceptation (ici), rencontre avec un médecin (sauf méthode sans médecin), adoption conclue, passage au centre, adoption faite ou non, suivi."
        action={<Link href="/contraception/methods" className="rounded-2xl border border-heading px-5 py-3 text-sm font-semibold text-heading">Fiches des contraceptifs</Link>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Demandes" value={summary?.total ?? '…'} />
        <Stat label="À traiter" value={summary?.pending ?? '…'} hint="En attente d’acceptation" />
        <Stat label="En cours" value={summary?.in_progress ?? '…'} hint="Rencontre ou passage au centre" />
        <Stat label="Adoptions faites" value={summary?.adopted ?? '…'} hint="En suivi" />
      </div>
      <EdotoFilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Nom ou e-mail du jeune, contraceptif…' }}
        quick={{ key: 'status', allLabel: 'Toutes', allCount: data?.facets?.total, options: data?.facets?.statuses ?? [] }}
        filters={filters}
        values={values}
        onChange={(p) => setValues((v) => ({ ...v, ...p }))}
        onReset={() => { setValues(EMPTY); setSearch(''); }}
        resultLabel={`${rows.length} demande${rows.length > 1 ? 's' : ''}`}
      />
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : !data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-[#EFECE7]" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-[#E9E5DF] bg-white py-16 text-center text-sm text-body">Aucune demande pour ces filtres.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E9E5DF] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-[#E9E5DF] text-left text-[11px] uppercase tracking-[0.12em] text-[#8A837A]">
                  <th className="px-5 py-3 font-medium">Demandé le</th>
                  <th className="px-5 py-3 font-medium">Jeune</th>
                  <th className="px-5 py-3 font-medium">Contraceptif</th>
                  <th className="px-5 py-3 font-medium">Accompagnement</th>
                  <th className="px-5 py-3 font-medium">Étape</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => {
                  const cur = r.steps.find((x: any) => x.state === 'current' || x.state === 'failed');
                  return (
                    <tr key={r.id} className="border-b border-[#EFECE7] last:border-0 hover:bg-[#FBFAF8]">
                      <td className="whitespace-nowrap px-5 py-4 text-body">{when(r.created_at)}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-heading">{r.user.name}</p>
                        <p className="text-xs text-[#8A837A]">{r.user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-3">
                          {r.method.image_url ? (
                            <img src={siteImage(r.method.image_url) as string} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#F3EEE7] font-serif text-lg text-heading">{r.method.name.charAt(0)}</span>
                          )}
                          <span className="text-heading">{r.method.name}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4"><Pill tone={r.requires_doctor ? 'neutral' : 'info'}>{r.requires_doctor ? 'Avec un médecin' : 'Sans médecin'}</Pill></td>
                      <td className="px-5 py-4">
                        <p className="mb-1.5 text-xs text-body">{cur ? `${cur.n}/7 · ${cur.label}` : 'Terminé'}</p>
                        <div className="w-36"><StepsBar steps={r.steps} /></div>
                      </td>
                      <td className="px-5 py-4"><Pill tone={TONE[r.status]}>{r.status_label}</Pill></td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => open(r.id)}
                          title="Voir les détails"
                          aria-label={`Voir les détails de la demande de ${r.user.name}`}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${r.status === 'pending' ? 'bg-heading text-white hover:bg-accent' : 'border border-[#E9E5DF] text-heading hover:border-heading'}`}
                        >
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                          {r.status === 'pending' ? 'Traiter' : 'Détails'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail && (
        <Modal title={`${detail.method.name} · ${detail.user.name}`} onClose={() => setDetail(null)} wide>
          <div className="grid gap-6 sm:grid-cols-[1fr_1fr]">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Pill tone={TONE[detail.status]}>{detail.status_label}</Pill>
                <Pill tone={detail.requires_doctor ? 'neutral' : 'info'}>{detail.requires_doctor ? 'Avec un médecin' : 'Sans médecin'}</Pill>
              </div>
              <StepsList steps={detail.steps} />
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-body">{detail.user.email}</p>
              {detail.youth_note && <div className="rounded-2xl bg-[#F9F8F6] p-3"><p className="text-xs text-[#8A837A]">Message du jeune</p><p className="whitespace-pre-line text-heading">{detail.youth_note}</p></div>}
              {detail.refuse_reason && <p className="text-[#9B2C2C]">Motif du refus : {detail.refuse_reason}</p>}
              {detail.appointment && <p className="text-heading">Rencontre : {when(detail.appointment.starts_at)} avec {detail.appointment.doctor} ({detail.appointment.reference})</p>}
              {detail.conclusion_label && <p className="text-heading">Conclusion du médecin : {detail.conclusion_label}</p>}
              {detail.referral && <p className="text-heading">Centre : {detail.referral.center.name} · code {detail.referral.short_code}</p>}
              {detail.outcome && <p className="text-heading">Centre : {detail.outcome === 'done' ? 'méthode adoptée' : 'méthode non adoptée'}{detail.outcome_note ? ` (${detail.outcome_note})` : ''}</p>}
            </div>
          </div>

          {detail.status === 'pending' && (
            <div className="mt-6 rounded-2xl border border-[#E9E5DF] p-4">
              {!decision ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-body">Cette demande attend votre décision (étape 2 sur 7).</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDecision('refuse')} className="rounded-xl border border-[#9B2C2C] px-5 py-2.5 text-sm font-semibold text-[#9B2C2C] hover:bg-red-50">Refuser</button>
                    <button onClick={() => setDecision('accept')} className="rounded-xl bg-heading px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent">Accepter</button>
                  </div>
                </div>
              ) : decision === 'accept' ? (
                <div className="space-y-3">
                  <p className="font-medium text-heading">Accepter la demande</p>
                  {!detail.requires_doctor && (
                    <Field label="Centre où le jeune ira" hint="(obligatoire : code QR envoyé)">
                      <select value={form.center_id} onChange={(e) => setForm((f) => ({ ...f, center_id: e.target.value }))} className={inputClass}>
                        <option value="">Choisir…</option>
                        {detail.centers.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.city ? ` (${c.city})` : ''}</option>)}
                      </select>
                    </Field>
                  )}
                  <Field label="Raison" hint="(facultative, envoyée au jeune)"><textarea rows={3} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value.slice(0, 600) }))} className={inputClass} /></Field>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setDecision(null)} disabled={!!busy} className="rounded-xl px-4 py-2.5 text-sm text-body">Retour</button>
                    <button disabled={!!busy || (!detail.requires_doctor && !form.center_id)} onClick={() => act('accept', 'accept', { note: form.note, center_id: form.center_id })} className="rounded-xl bg-heading px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                      {busy === 'accept' ? 'Envoi…' : detail.requires_doctor ? 'Confirmer : rencontre avec un médecin' : 'Confirmer et envoyer le code QR'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-medium text-heading">Refuser la demande</p>
                  <Field label="Raison" hint="(obligatoire, envoyée au jeune)"><textarea rows={4} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value.slice(0, 600) }))} className={inputClass} /></Field>
                  {!form.reason.trim() && <p className="text-xs text-[#9B2C2C]">Indiquez la raison du refus pour pouvoir confirmer.</p>}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setDecision(null)} disabled={!!busy} className="rounded-xl px-4 py-2.5 text-sm text-body">Retour</button>
                    <button disabled={!!busy || !form.reason.trim()} onClick={() => act('refuse', 'refuse', { reason: form.reason })} className="rounded-xl bg-[#9B2C2C] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                      {busy === 'refuse' ? 'Envoi…' : 'Confirmer le refus'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-[#E9E5DF] p-4">
            <p className="font-medium text-heading">Rapports de suivi (étape 7)</p>
            <div className="mt-3 flex gap-2">
              <textarea rows={2} value={form.followup} onChange={(e) => setForm((f) => ({ ...f, followup: e.target.value.slice(0, 2000) }))} placeholder="Ajouter un rapport (visible par le jeune)" className={inputClass} />
              <button disabled={!!busy || !form.followup.trim()} onClick={() => act('followup', 'followups', { content: form.followup })} className="shrink-0 self-start rounded-xl bg-heading px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Ajouter</button>
            </div>
            {detail.followups?.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {detail.followups.map((f: any) => (
                  <li key={f.id} className="rounded-xl bg-[#F9F8F6] p-3 text-sm">
                    <p className="text-xs text-[#8A837A]">{f.author_label} · {when(f.created_at)}</p>
                    <p className="mt-1 whitespace-pre-line text-heading">{f.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-body">Aucun rapport pour le moment.</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

ContraceptionRequests.authenticate = { permissions: adminOnly };
ContraceptionRequests.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
