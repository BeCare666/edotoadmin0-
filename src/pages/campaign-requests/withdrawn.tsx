import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layouts/admin';
import { adminOnly } from '@/utils/auth-utils';
import KitRequestsBoard from '@/components/campaign/kit-requests-board';

// Demandes de kit : étape « withdrawn » (voir components/campaign/kit-requests-board.tsx)
export default function KitRequestsWithdrawn() {
  return <KitRequestsBoard stage="withdrawn" />;
}

KitRequestsWithdrawn.authenticate = {
  permissions: adminOnly,
};
KitRequestsWithdrawn.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
