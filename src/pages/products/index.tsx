import Layout from '@/components/layouts/admin';
import ProductsBrowser from '@/components/product/products-browser';
import { useMeQuery } from '@/data/user';
import { adminOnly } from '@/utils/auth-utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Tous les produits (toutes boutiques) avec filtres réels. L'ajout passe par la boutique de l'admin.
export default function ProductsPage() {
  const { data: me } = useMeQuery();
  const shopSlug = (me as any)?.shops?.[0]?.slug;
  return <ProductsBrowser createHref={shopSlug ? `/${shopSlug}/products/create` : undefined} />;
}
ProductsPage.authenticate = {
  permissions: adminOnly,
};
ProductsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
