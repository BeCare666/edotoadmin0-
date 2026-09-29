import { useCallback, useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall } from '@/components/campaign/campaign-api';

interface SponsorRow {
  id: number;
  name: string;
  email: string;
  campaigns_count: number;
  account_status: 'not_invited' | 'invited' | 'active';
  invitation_expired: boolean;
  invited_at: string | null;
  activated_at: string | null;
}

const STATUS: Record<SponsorRow['account_status'], { label: string; className: string }> = {
  not_invited: { label: 'Non invité', className: 'bg-gray-100 text-gray-700' },
  invited: { label: 'Invité', className: 'bg-amber-50 text-amber-800' },
  active: { label: 'Espace actif', className: 'bg-emerald-50 text-emerald-700' },
};

// Sponsors et leur espace (compte créé sur invitation ; le sponsor choisit son mot de passe via le lien reçu)
export default function SponsorsPage() {
  const [rows, setRows] = useState<SponsorRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await apiCall('admin/sponsors'));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async (s: SponsorRow) => {
    setBusyId(s.id);
    try {
      const res = await apiCall(`admin/sponsors/${s.id}/invite`, { method: 'POST' });
      toast.success(res.message);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Card className="mb-8">
        <PageHeading title="Sponsors" />
        <p className="mt-1 text-sm text-body">
          Invitez un sponsor : il reçoit un e-mail pour choisir son mot de passe (lien valable 7 jours), puis accède à son
          espace, limité aux campagnes qu&apos;il soutient. Les sponsors se créent dans le formulaire d&apos;une campagne.
        </p>
      </Card>
      <Card className="overflow-x-auto p-0 md:p-0">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : !rows ? (
          <p className="p-6 text-sm text-body">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-body">Aucun sponsor. Ajoutez-en depuis le formulaire d&apos;une campagne (« + Nouveau sponsor »).</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border-200 text-xs uppercase tracking-wider text-body">
              <tr>
                <th className="px-6 py-4 font-medium">Sponsor</th>
                <th className="px-6 py-4 font-medium">Campagnes</th>
                <th className="px-6 py-4 font-medium">Espace sponsor</th>
                <th className="px-6 py-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-100">
              {rows.map((s) => {
                const st = STATUS[s.account_status];
                return (
                  <tr key={s.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-heading">{s.name}</div>
                      <div className="text-xs text-body">{s.email}</div>
                    </td>
                    <td className="px-6 py-4">{s.campaigns_count}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.className}`}>{st.label}</span>
                      {s.account_status === 'invited' && s.invitation_expired && <span className="ms-2 text-xs text-red-600">lien expiré</span>}
                      {s.activated_at && <div className="mt-1 text-xs text-body">depuis le {new Date(s.activated_at).toLocaleDateString('fr-FR')}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.account_status !== 'active' && (
                        <button
                          onClick={() => invite(s)}
                          disabled={busyId === s.id}
                          className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                        >
                          {busyId === s.id ? '…' : s.account_status === 'invited' ? 'Renvoyer l’invitation' : 'Inviter'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

SponsorsPage.authenticate = { permissions: adminOnly };
SponsorsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
