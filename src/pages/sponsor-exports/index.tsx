import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall } from '@/components/campaign/campaign-api';

type Status = '' | 'pending' | 'approved' | 'rejected';
const TABS: { key: Status; label: string }[] = [
  { key: 'pending', label: 'En attente' },
  { key: 'approved', label: 'Acceptées' },
  { key: 'rejected', label: 'Refusées' },
  { key: '', label: 'Toutes' },
];
const BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-800' },
  approved: { label: 'Acceptée', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Refusée', className: 'bg-red-50 text-red-700' },
};

// Demandes d'export des sponsors : l'export Excel d'une campagne terminée n'est possible qu'après acceptation
export default function SponsorExportsPage() {
  const [status, setStatus] = useState<Status>('pending');
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<{ id: number; reason: string } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await apiCall(`admin/sponsor-exports${status ? `?status=${status}` : ''}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [status]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const decide = async (id: number, approve: boolean, reason?: string) => {
    setBusyId(id);
    try {
      const res = await apiCall(`admin/sponsor-exports/${id}/${approve ? 'approve' : 'reject'}`, {
        method: 'POST',
        body: JSON.stringify(approve ? {} : { reason }),
      });
      if (res.email_sent === false) toast.warning(`${res.message} L'e-mail au sponsor n'a pas pu être envoyé.`);
      else toast.success(`${res.message} Le sponsor est prévenu.`);
      setRejecting(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Card className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="md:w-1/2">
          <PageHeading title="Demandes d'export des sponsors" />
          <p className="mt-1 text-sm text-body">
            Une fois acceptée, la demande permet au sponsor de télécharger l&apos;Excel de la campagne (le même que dans
            l&apos;admin), sans limite.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:ms-auto" role="tablist">
          {TABS.map((t) => (
            <button key={t.key || 'all'} role="tab" aria-selected={status === t.key} onClick={() => setStatus(t.key)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${status === t.key ? 'border-accent bg-accent text-white' : 'border-border-200 bg-white text-heading hover:border-accent'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-x-auto p-0 md:p-0">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : !rows ? (
          <p className="p-6 text-sm text-body">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-body">Aucune demande dans cette catégorie.</p>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border-200 text-xs uppercase tracking-wider text-body">
              <tr>
                <th className="px-6 py-4 font-medium">Campagne</th>
                <th className="px-6 py-4 font-medium">Sponsor</th>
                <th className="px-6 py-4 font-medium">Demandée le</th>
                <th className="px-6 py-4 font-medium">État</th>
                <th className="px-6 py-4 text-right font-medium">Décision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-100">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-6 py-4"><Link href={`/campaigns/${r.campaign_id}`} className="font-medium text-heading hover:text-accent">{r.campaign_title}</Link></td>
                  <td className="px-6 py-4"><div className="text-heading">{r.sponsor_name}</div><div className="text-xs text-body">{r.sponsor_email}</div></td>
                  <td className="px-6 py-4 text-body">{new Date(r.requested_at).toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[r.status].className}`}>{BADGE[r.status].label}</span>
                    {r.decided_at && <div className="mt-1 text-xs text-body">{new Date(r.decided_at).toLocaleString('fr-FR')}{r.decided_by_name ? ` · ${r.decided_by_name}` : ''}</div>}
                    {r.status === 'rejected' && r.reason && <div className="mt-1 text-xs text-red-700">Motif : {r.reason}</div>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status === 'pending' && (
                      rejecting?.id === r.id ? (
                        <div className="ms-auto flex max-w-xs flex-col gap-2">
                          <textarea rows={2} maxLength={500} placeholder="Motif du refus (obligatoire)" value={rejecting?.reason ?? ''}
                            onChange={(e) => setRejecting({ id: r.id, reason: e.target.value })}
                            className="rounded-xl border border-border-200 px-3 py-2 text-xs" />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setRejecting(null)} className="px-2 text-xs text-body">Annuler</button>
                            <button onClick={() => decide(r.id, false, rejecting?.reason)} disabled={busyId === r.id || !rejecting?.reason?.trim()}
                              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Refuser</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => decide(r.id, true)} disabled={busyId === r.id}
                            className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50">Accepter</button>
                          <button onClick={() => setRejecting({ id: r.id, reason: '' })} disabled={busyId === r.id}
                            className="rounded-full border border-border-200 px-4 py-1.5 text-xs font-semibold text-heading hover:border-accent">Refuser</button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

SponsorExportsPage.authenticate = { permissions: adminOnly };
SponsorExportsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
