import Layout from '@/components/layouts/admin';
import ProductsBrowser from '@/components/product/products-browser';
import { useMeQuery } from '@/data/user';
import { adminOnly } from '@/utils/auth-utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Rupture et stock faible (19/10/2026) : stock de 9 ou moins, avec recherche, catégories et tri réels.
export default function ProductStockPage() {
  const { data: me } = useMeQuery();
  const shopSlug = (me as any)?.shops?.[0]?.slug;
  return <ProductsBrowser createHref={shopSlug ? `/${shopSlug}/products/create` : undefined} fixedFilters={{ stock: 'alert' }} title="Rupture et stock faible" subtitle="Produits à 9 unités ou moins." />;
}
ProductStockPage.authenticate = {
  permissions: adminOnly,
};
ProductStockPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
