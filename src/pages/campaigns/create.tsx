import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import CampaignForm, { CampaignFormValues } from '@/components/campaign/campaign-form';
import { apiCall } from '@/components/campaign/campaign-api';

// ?proposal=ID (15/10/2026) : formulaire prérempli avec la demande validée d'un sponsor ;
// le sponsor de la demande est ajouté avec le budget proposé (modifiable avant d'enregistrer).
export default function CreateCampaignPage() {
  const router = useRouter();
  const proposalId = Number(router.query.proposal) || null;
  const [initial, setInitial] = useState<CampaignFormValues | null>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !proposalId) return;
    apiCall(`admin/campaign-proposals/${proposalId}`)
      .then((p) => {
        if (p.status !== 'approved') {
          setError(p.status === 'created' ? 'Une campagne a déjà été créée à partir de cette demande.' : 'Validez d’abord la demande avant de créer la campagne.');
          return;
        }
        setProposal(p);
        setInitial({
          title: p.title ?? '',
          objective_kits: String(p.objective_kits ?? ''),
          date_start: p.date_start ?? '',
          date_end: p.date_end ?? '',
          description: p.description ?? '',
          image_url: '',
          cities: p.cities ?? [],
          sponsors: [{ sponsor_id: p.sponsor_id, amount: String(p.budget ?? 0) }],
          target_sex: 'all',
          target_age_min: '',
          target_age_max: '',
        });
      })
      .catch((e) => setError(e.message));
  }, [router.isReady, proposalId]);

  return (
    <>
      <Card className="mb-8">
        <PageHeading title={proposalId ? 'Nouvelle campagne à partir d’une demande' : 'Nouvelle campagne'} />
        {proposal && (
          <p className="mt-2 text-sm text-body">
            Demande de <strong className="text-heading">{proposal.sponsor_name}</strong> : vérifiez et complétez les informations avant d&apos;enregistrer.
            La demande passera à « Campagne créée » et le sponsor suivra la campagne depuis son espace.{' '}
            <Link href={`/campaign-proposals?id=${proposal.id}`} className="text-accent hover:underline">Revoir la demande</Link>
          </p>
        )}
      </Card>
      {!proposalId ? (
        <CampaignForm />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !initial ? (
        <p className="text-sm text-body">Chargement de la demande…</p>
      ) : (
        <CampaignForm initial={initial} proposalId={proposalId} />
      )}
    </>
  );
}

CreateCampaignPage.authenticate = { permissions: adminOnly };
CreateCampaignPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
