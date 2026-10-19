import Layout from '@/components/layouts/admin';
import UsersBrowser from '@/components/user/users-browser';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { adminOnly } from '@/utils/auth-utils';

// Vendeurs actifs (19/10/2026) : l'API ignorait la recherche et le statut ; liste filtrable commune.
export default function VendorsPage() {
  return <UsersBrowser fixedRole="store_owner" fixedFilters={{ is_active: '1' }} eyebrow="Comptes" title="Vendeurs" subtitle="Comptes vendeurs actifs." />;
}

VendorsPage.authenticate = {
  permissions: adminOnly,
};
VendorsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
