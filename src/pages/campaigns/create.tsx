import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layouts/admin';
import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import { adminOnly } from '@/utils/auth-utils';
import CampaignForm from '@/components/campaign/campaign-form';

export default function CreateCampaignPage() {
  return (
    <>
      <Card className="mb-8">
        <PageHeading title="Nouvelle campagne" />
      </Card>
      <CampaignForm />
    </>
  );
}

CreateCampaignPage.authenticate = { permissions: adminOnly };
CreateCampaignPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: { ...(await serverSideTranslations(locale, ['table', 'common', 'form'])) },
});
