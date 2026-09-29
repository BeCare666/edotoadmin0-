import Card from '@/components/common/card';
import AdminLayout from '@/components/layouts/admin';
import { adminOnly } from '@/utils/auth-utils';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Inscription des vendeurs fermée pour l'instant (décision du 25/09/2026).
// L'ancien formulaire (components/become-seller/become-seller-form) enregistrait via POST became-seller,
// route qui fait passer le compte connecté au rôle vendeur : il reste en place pour la réouverture.
export default function BecomeSeller() {
  const { t } = useTranslation();
  return (
    <>
      <Card className="mb-8">
        <h1 className="text-lg font-semibold text-heading">{t('form:become-seller-form-title')}</h1>
      </Card>
      <Card className="text-center">
        <p className="text-base font-semibold text-heading">Inscription des vendeurs bientôt disponible.</p>
        <p className="mt-2 text-sm text-body">
          Pour l&apos;instant, seule la boutique E·Doto publie des produits. Les vendeurs pourront plus tard
          s&apos;inscrire, créer leur boutique et vendre.
        </p>
      </Card>
    </>
  );
}
BecomeSeller.authenticate = {
  permissions: adminOnly,
};
BecomeSeller.Layout = AdminLayout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common'])),
  },
});
