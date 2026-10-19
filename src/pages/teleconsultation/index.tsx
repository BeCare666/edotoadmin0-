import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import { apiCall } from '@/components/campaign/campaign-api';
import { adminOnly } from '@/utils/auth-utils';
import { Field, Modal, PageHead, Pager, Pill, Stat, inputClass, when } from '@/components/teleconsultation/tc-ui';

// Téléconsultation : rendez-vous (19/10/2026). Filtres réels (statut, mode, médecin, période, rappel en échec).
const EMPTY: FilterValues = { status: '', mode: '', doctor_id: '', date_from: '', date_to: '', reminder: '' };
const SORTS = [
  { value: 'desc', label: 'Plus récents d’abord' },
  { value: 'asc', label: 'Plus anciens d’abord' },
];
const STATUS_TONE: Record<string, string> = { booked: 'info', completed: 'ok', cancelled: 'stop', no_show: 'wait' };

export default function TeleconsultationAppointments() {
  const [summary, setSummary] = useState<any>(null);
  const [facets, setFacets] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [sort, setSort] = useState('desc');
  const [page, setPage] = useState(1);
  const [cancel, setCancel] = useState<{ id: number; reference: string; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    Object.entries(values).forEach(([k, v]) => v && q.set(k, v));
    return q;
  }, [search, values]);

  useEffect(() => {
    apiCall('admin/teleconsultation/summary').then(setSummary).catch(() => setSummary(null));
  }, [tick]);
  useEffect(() => {
    apiCall(`admin/teleconsultation/appointments/facets?${qs.toString()}`).then(setFacets).catch(() => setFacets(null));
  }, [qs, tick]);
  const load = useCallback(async () => {
    setError(null);
    try {
      const q = new URLSearchParams(qs);
      q.set('page', String(page));
      q.set('sort', sort);
      setData(await apiCall(`admin/teleconsultation/appointments?${q.toString()}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [qs, page, sort]);
  useEffect(() => {
    load();
  }, [load, tick]);

  const filters: FilterDef[] = useMemo(
    () => [
      { type: 'chips', key: 'mode', label: 'Mode', options: facets?.modes ?? [] },
      { type: 'select', key: 'doctor_id', label: 'Médecin', placeholder: 'Tous les médecins', options: facets?.doctors ?? [] },
      { type: 'dates', key: 'period', label: 'Date du rendez-vous (heure du Bénin)', fromKey: 'date_from', toKey: 'date_to' },
      { type: 'chips', key: 'reminder', label: 'Rappel', options: [{ value: 'failed', label: 'Rappel non envoyé', count: facets?.reminder_failed ?? 0 }] },
    ],
    [facets],
  );

  const doCancel = async () => {
    if (!cancel) return;
    setBusy(true);
    try {
      const res = await apiCall(`admin/teleconsultation/appointments/${cancel.id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: cancel.reason }) });
      toast.success(res.message);
      setCancel(null);
      setTick((n) => n + 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const total = data?.total ?? 0;
  return (
    <>
      <PageHead
        eyebrow="Téléconsultation"
        title="Rendez-vous"
        subtitle="Rendez-vous pris par les jeunes en visio ou par appel. Rappel automatique moins de 10 minutes avant : e-mail (visio) ou SMS Brevo (appel)."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/teleconsultation/doctors" className="rounded-2xl border border-heading px-4 py-2.5 text-sm font-semibold text-heading">Médecins</Link>
            <Link href="/teleconsultation/centers" className="rounded-2xl border border-heading px-4 py-2.5 text-sm font-semibold text-heading">Centres</Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="À venir" value={summary?.appointments?.upcoming ?? '…'} hint={summary ? `${summary.appointments.video} en visio · ${summary.appointments.phone} par appel au total` : undefined} />
        <Stat label="Terminés" value={summary?.appointments?.completed ?? '…'} hint={summary ? `${summary.appointments.no_show} absents · ${summary.appointments.cancelled} annulés` : undefined} />
        <Stat label="Médecins actifs" value={summary ? `${summary.doctors.active} / ${summary.doctors.total}` : '…'} />
        <Stat label="Orientations" value={summary?.referrals?.total ?? '…'} hint={summary ? `${summary.referrals.completed} prises en charge par un centre` : undefined} />
      </div>

      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Référence, nom, e-mail ou téléphone du jeune…' }}
        quick={{ key: 'status', allLabel: 'Tous', allCount: facets?.total, options: facets?.statuses ?? [] }}
        filters={filters}
        values={values}
        onChange={(patch) => { setValues((v) => ({ ...v, ...patch })); setPage(1); }}
        onReset={() => { setValues(EMPTY); setSearch(''); setSort('desc'); setPage(1); }}
        sort={{ value: sort, options: SORTS, onChange: (v) => { setSort(v); setPage(1); } }}
        resultLabel={`${total} rendez-vous`}
      />

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : !data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-[#EFECE7]" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E9E5DF] bg-white">
          {data.data.length === 0 ? (
            <p className="py-16 text-center text-sm text-body">Aucun rendez-vous pour ces filtres.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-[#E9E5DF] text-left text-[11px] uppercase tracking-[0.12em] text-[#8A837A]">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Jeune</th>
                    <th className="px-5 py-3 font-medium">Mode</th>
                    <th className="px-5 py-3 font-medium">Médecin</th>
                    <th className="px-5 py-3 font-medium">Statut</th>
                    <th className="px-5 py-3 font-medium">Rappel</th>
                    <th className="px-5 py-3 font-medium">Suite</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE7]">
                  {data.data.map((a: any) => {
                    const reminderAt = a.mode === 'video' ? a.reminder_email_at : a.reminder_sms_at;
                    return (
                      <tr key={a.id} className="align-top">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-heading">{when(a.starts_at)}</p>
                          <p className="text-xs text-[#8A837A]">{a.reference}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-heading">{a.patient_name}</p>
                          <p className="text-xs text-[#8A837A]">{a.patient_phone || a.patient_email}</p>
                        </td>
                        <td className="px-5 py-3.5">{a.mode_label}</td>
                        <td className="px-5 py-3.5">{a.doctor_name}</td>
                        <td className="px-5 py-3.5">
                          <Pill tone={STATUS_TONE[a.status]}>{a.status_label}</Pill>
                          {a.cancel_reason && <p className="mt-1 max-w-[180px] text-xs text-[#8A837A]">{a.cancel_reason}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          {a.reminder_error ? <Pill tone="stop">Échec</Pill> : reminderAt ? <Pill tone="ok">Envoyé</Pill> : <span className="text-[#8A837A]">Pas encore</span>}
                          {a.reminder_error && <p className="mt-1 max-w-[200px] text-[#9B2C2C]">{a.reminder_error}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          {a.report_done ? <p className="text-heading">Compte rendu : {a.request_label}</p> : <p className="text-[#8A837A]">Pas de compte rendu</p>}
                          {a.short_code && <p className="text-[#57524B]">Orienté : {a.center_name} ({a.short_code})</p>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {a.status === 'booked' && (
                            <button onClick={() => setCancel({ id: a.id, reference: a.reference, reason: '' })} className="text-xs font-medium text-[#9B2C2C] hover:underline">Annuler</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={data.page} last={data.last_page} total={data.total} onPage={setPage} unit="rendez-vous" />
        </div>
      )}

      {cancel && (
        <Modal title={`Annuler ${cancel.reference}`} onClose={() => setCancel(null)}>
          <p className="text-sm text-body">Le jeune et le médecin sont prévenus par e-mail avec ce motif.</p>
          <div className="mt-4">
            <Field label="Motif">
              <textarea rows={3} value={cancel.reason} onChange={(e) => setCancel({ ...cancel, reason: e.target.value.slice(0, 300) })} className={inputClass} />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setCancel(null)} className="rounded-xl px-4 py-2.5 text-sm text-body">Retour</button>
            <button onClick={doCancel} disabled={busy || !cancel.reason.trim()} className="rounded-xl bg-[#9B2C2C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Annuler le rendez-vous</button>
          </div>
        </Modal>
      )}
    </>
  );
}

TeleconsultationAppointments.authenticate = { permissions: adminOnly };
TeleconsultationAppointments.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
