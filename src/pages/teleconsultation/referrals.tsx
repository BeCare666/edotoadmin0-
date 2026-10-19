import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layouts/admin';
import EdotoFilterBar, { FilterDef, FilterValues } from '@/components/filters/edoto-filter-bar';
import { apiCall } from '@/components/campaign/campaign-api';
import { adminOnly } from '@/utils/auth-utils';
import { PageHead, Pager, Pill, when } from '@/components/teleconsultation/tc-ui';

// Orientations par code QR (19/10/2026) : suivi des jeunes orientés vers un centre. Le contenu médical
// n'apparaît pas ici : il est réservé au médecin et au centre recommandé.
const EMPTY: FilterValues = { status: '', center_id: '', request_type: '', urgency: '', date_from: '', date_to: '' };
const STATUS_TONE: Record<string, string> = { issued: 'info', viewed: 'wait', completed: 'ok', expired: 'stop' };
const URG_TONE: Record<string, string> = { urgent: 'stop', soon: 'wait', routine: 'neutral' };

export default function TeleconsultationReferrals() {
  const [facets, setFacets] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<FilterValues>(EMPTY);
  const [page, setPage] = useState(1);

  useEffect(() => {
    apiCall('admin/teleconsultation/referrals/facets').then(setFacets).catch(() => setFacets(null));
  }, []);
  const load = useCallback(async () => {
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(page) });
      if (search) q.set('search', search);
      Object.entries(values).forEach(([k, v]) => v && q.set(k, v));
      setData(await apiCall(`admin/teleconsultation/referrals?${q.toString()}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [page, search, values]);
  useEffect(() => {
    load();
  }, [load]);

  const filters: FilterDef[] = useMemo(
    () => [
      { type: 'select', key: 'center_id', label: 'Centre', placeholder: 'Tous les centres', options: facets?.centers ?? [] },
      { type: 'chips', key: 'request_type', label: 'Demande', options: facets?.request_types ?? [] },
      { type: 'chips', key: 'urgency', label: 'Urgence', options: facets?.urgency ?? [] },
      { type: 'dates', key: 'period', label: "Date d'orientation", fromKey: 'date_from', toKey: 'date_to' },
    ],
    [facets],
  );

  return (
    <>
      <PageHead
        eyebrow="Téléconsultation"
        title="Orientations"
        subtitle="Jeunes orientés vers un centre partenaire après leur téléconsultation, avec l’état de leur code QR. Le dossier médical reste réservé au médecin et au centre recommandé."
      />
      <EdotoFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: 'Code, référence ou nom du jeune…' }}
        quick={{ key: 'status', allLabel: 'Toutes', allCount: facets?.total, options: facets?.statuses ?? [] }}
        filters={filters}
        values={values}
        onChange={(p) => { setValues((v) => ({ ...v, ...p })); setPage(1); }}
        onReset={() => { setValues(EMPTY); setSearch(''); setPage(1); }}
        resultLabel={`${data?.total ?? 0} orientation${(data?.total ?? 0) > 1 ? 's' : ''}`}
      />
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : !data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-[#EFECE7]" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E9E5DF] bg-white">
          {data.data.length === 0 ? (
            <p className="py-16 text-center text-sm text-body">Aucune orientation pour ces filtres.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b border-[#E9E5DF] text-left text-[11px] uppercase tracking-[0.12em] text-[#8A837A]">
                    <th className="px-5 py-3 font-medium">Orienté le</th>
                    <th className="px-5 py-3 font-medium">Jeune</th>
                    <th className="px-5 py-3 font-medium">Demande</th>
                    <th className="px-5 py-3 font-medium">Centre</th>
                    <th className="px-5 py-3 font-medium">Code</th>
                    <th className="px-5 py-3 font-medium">État</th>
                    <th className="px-5 py-3 font-medium">Envoi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE7]">
                  {data.data.map((f: any) => (
                    <tr key={f.id} className="align-top">
                      <td className="px-5 py-3.5"><p className="text-heading">{when(f.created_at)}</p><p className="text-xs text-[#8A837A]">{f.reference} · {f.mode_label}</p></td>
                      <td className="px-5 py-3.5"><p className="text-heading">{f.patient_name}</p><p className="text-xs text-[#8A837A]">par {f.doctor_name}</p></td>
                      <td className="px-5 py-3.5"><p className="text-heading">{f.request_label}</p><Pill tone={URG_TONE[f.urgency]}>{f.urgency_label}</Pill></td>
                      <td className="px-5 py-3.5"><p className="text-heading">{f.center_name}</p><p className="text-xs text-[#8A837A]">{f.center_city}</p></td>
                      <td className="px-5 py-3.5 font-mono tracking-widest text-heading">{f.short_code}</td>
                      <td className="px-5 py-3.5">
                        <Pill tone={STATUS_TONE[f.status]}>{f.status_label}</Pill>
                        <p className="mt-1 text-xs text-[#8A837A]">{f.completed_at ? `le ${when(f.completed_at, false)}` : f.viewed_at ? `ouvert le ${when(f.viewed_at, false)}` : `jusqu’au ${when(f.expires_at, false)}`}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <p className={f.email_sent ? 'text-emerald-700' : 'text-[#9B2C2C]'}>E-mail {f.email_sent ? 'envoyé' : 'non envoyé'}</p>
                        {f.mode === 'phone' && <p className={f.sms_sent ? 'text-emerald-700' : 'text-[#9B2C2C]'}>SMS {f.sms_sent ? 'envoyé' : 'non envoyé'}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={data.page} last={data.last_page} total={data.total} onPage={setPage} unit="orientations" />
        </div>
      )}
    </>
  );
}

TeleconsultationReferrals.authenticate = { permissions: adminOnly };
TeleconsultationReferrals.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
