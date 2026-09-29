import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-toastify';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import { apiCall, downloadFile, fcfa, formatDate, STATUS_BADGE } from '@/components/campaign/campaign-api';

const th = 'px-4 py-2 font-semibold';
const td = 'px-4 py-2';

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-border-200 p-4">
      <div className="text-xs text-body">{label}</div>
      <div className="mt-1 text-xl font-semibold text-heading">{value}</div>
    </div>
  );
}

function StatsTable({ title, label, rows }: { title: string; label: string; rows: { label: string; registrations: number; picked_up: number }[] }) {
  return (
    <Card className="overflow-x-auto p-0">
      <h2 className="p-4 text-base font-semibold text-heading">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-body">Aucun inscrit.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-y border-border-200 text-xs uppercase tracking-wider text-body">
            <tr><th className={th}>{label}</th><th className={th}>Inscrits</th><th className={th}>Kits retirés</th><th className={th}>Sans retrait</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border-200 last:border-0">
                <td className={td}>{r.label}</td><td className={td}>{r.registrations}</td><td className={td}>{r.picked_up}</td><td className={td}>{r.registrations - r.picked_up}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const id = Number(router.query.id);
  const [c, setC] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) return;
    apiCall(`admin/campaigns/${id}`).then(setC).catch((e) => setError(e.message));
  }, [router.isReady, id]);

  const exportOne = async () => {
    setExporting(true);
    try {
      await downloadFile(`admin/campaigns/${id}/export`, `campagne-${id}.xlsx`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!c) return <p className="text-sm text-body">Chargement…</p>;
  const badge = STATUS_BADGE[c.status as keyof typeof STATUS_BADGE];

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <PageHeading title={c.title} />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-body">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge?.className ?? ''}`}>{badge?.label ?? c.status}</span>
            <span>{formatDate(c.date_start)} → {formatDate(c.date_end)}</span>
            <span>Ville(s) : {c.cities.join(', ') || '—'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportOne} disabled={exporting} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
            {exporting ? 'Export…' : 'Télécharger l’Excel'}
          </button>
          <Link href={`/campaigns/${c.id}/edit`} className="rounded-md border border-border-200 px-4 py-2 text-sm font-semibold text-heading hover:border-accent">Modifier</Link>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="Kits fournis" value={c.objective_kits} />
        <Stat label="Inscrits" value={c.registrations_count} />
        <Stat label="Kits retirés" value={c.picked_up_count} />
        <Stat label="Inscrits sans retrait" value={c.registrations_count - c.picked_up_count} />
        <Stat label="Budget (sponsors)" value={fcfa(c.budget)} />
      </div>

      {c.description && <Card><p className="whitespace-pre-line text-sm text-heading">{c.description}</p></Card>}

      <Card className="overflow-x-auto p-0">
        <h2 className="p-4 text-base font-semibold text-heading">Sponsors</h2>
        {c.sponsors.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-body">Aucun sponsor.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-y border-border-200 text-xs uppercase tracking-wider text-body"><tr><th className={th}>Sponsor</th><th className={th}>E-mail</th><th className={th}>Montant</th></tr></thead>
            <tbody>
              {c.sponsors.map((s: any) => (
                <tr key={`${s.sponsor_id}-${s.email}`} className="border-b border-border-200 last:border-0">
                  <td className={td}>{s.name}</td><td className={td}>{s.email}</td><td className={td}>{fcfa(s.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <StatsTable title="Par point de retrait" label="Point de retrait" rows={c.stats.by_pickup_point} />
        <StatsTable title="Par ville" label="Ville" rows={c.stats.by_city} />
      </div>

      <Card className="overflow-x-auto p-0">
        <h2 className="p-4 text-base font-semibold text-heading">Inscrits ({c.registrations.length})</h2>
        {c.registrations.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-body">Aucun inscrit.</p>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-y border-border-200 text-xs uppercase tracking-wider text-body">
              <tr><th className={th}>Nom</th><th className={th}>E-mail</th><th className={th}>Ville</th><th className={th}>Point de retrait</th><th className={th}>Inscrit le</th><th className={th}>Kit retiré</th></tr>
            </thead>
            <tbody>
              {c.registrations.map((r: any) => (
                <tr key={r.id} className="border-b border-border-200 last:border-0">
                  <td className={td}>{r.full_name}</td>
                  <td className={td}>{r.email}</td>
                  <td className={td}>{r.city || 'Non renseignée'}</td>
                  <td className={td}>{r.pickup_center_name || `Point ${r.pickup_center}`}</td>
                  <td className={td}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className={td}>{r.picked_up ? `Oui (${new Date(r.picked_up_at).toLocaleDateString('fr-FR')})` : 'Non'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

CampaignDetailPage.authenticate = { permissions: adminOnly };
CampaignDetailPage.Layout = Layout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
