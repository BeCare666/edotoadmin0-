import Layout from '@/components/layouts/admin';
import UsersBrowser from '@/components/user/users-browser';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { adminOnly } from '@/utils/auth-utils';

// Vendeurs en attente (19/10/2026) : comptes vendeurs non activés, liste filtrable commune.
export default function PendingVendorsPage() {
  return <UsersBrowser fixedRole="store_owner" fixedFilters={{ is_active: '0' }} eyebrow="Comptes" title="Vendeurs en attente" subtitle="Comptes vendeurs pas encore activés." />;
}

PendingVendorsPage.authenticate = {
  permissions: adminOnly,
};
PendingVendorsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
