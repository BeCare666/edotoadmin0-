import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import CampaignForm, { CampaignFormValues } from '@/components/campaign/campaign-form';
import { apiCall } from '@/components/campaign/campaign-api';

export default function EditCampaignPage() {
  const router = useRouter();
  const id = Number(router.query.id);
  const [initial, setInitial] = useState<CampaignFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !id) return;
    apiCall(`admin/campaigns/${id}`)
      .then((c) =>
        setInitial({
          title: c.title ?? '',
          objective_kits: String(c.objective_kits ?? ''),
          date_start: c.date_start ?? '',
          date_end: c.date_end ?? '',
          description: c.description ?? '',
          image_url: c.image_url ?? '',
          cities: c.cities ?? [],
          // Liens sans sponsor enregistré (anciennes données) : non modifiables ici
          sponsors: (c.sponsors ?? []).filter((s: any) => s.sponsor_id).map((s: any) => ({ sponsor_id: s.sponsor_id, amount: String(s.amount) })),
        }),
      )
      .catch((e) => setError(e.message));
  }, [router.isReady, id]);

  return (
    <>
      <Card className="mb-8">
        <PageHeading title="Modifier la campagne" />
      </Card>
      {error ? <p className="text-sm text-red-600">{error}</p> : !initial ? <p className="text-sm text-body">Chargement…</p> : <CampaignForm campaignId={id} initial={initial} />}
    </>
  );
}

EditCampaignPage.authenticate = { permissions: adminOnly };
EditCampaignPage.Layout = Layout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
