import Layout from '@/components/layouts/admin';
import UsersBrowser from '@/components/user/users-browser';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { adminOnly } from '@/utils/auth-utils';

// Clients : comptes users.role = 'customer' (l'ancienne liste lisait une table de permissions vide)
export default function CustomersPage() {
  return <UsersBrowser fixedRole="customer" eyebrow="Comptes" title="Clients" subtitle="Comptes clients du site, avec leurs commandes." />;
}

CustomersPage.authenticate = {
  permissions: adminOnly,
};
CustomersPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
