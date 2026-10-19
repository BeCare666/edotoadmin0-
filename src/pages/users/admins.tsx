import Layout from '@/components/layouts/admin';
import UsersBrowser from '@/components/user/users-browser';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { adminOnly } from '@/utils/auth-utils';

// Administrateurs (19/10/2026) : même liste filtrable que « Tous les utilisateurs » ; l'ancienne liste n'avait ni recherche ni filtre réels.
export default function Admins() {
  return <UsersBrowser fixedRole="super_admin" eyebrow="Comptes" title="Administrateurs" subtitle="Comptes super admin de l'espace d'administration." />;
}

Admins.authenticate = {
  permissions: adminOnly,
};
Admins.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
