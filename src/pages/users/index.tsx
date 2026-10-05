import Layout from '@/components/layouts/admin';
import UsersBrowser from '@/components/user/users-browser';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { adminOnly } from '@/utils/auth-utils';

// Tous les comptes, avec filtres réels
export default function AllUsersPage() {
  return <UsersBrowser />;
}

AllUsersPage.authenticate = {
  permissions: adminOnly,
};
AllUsersPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
