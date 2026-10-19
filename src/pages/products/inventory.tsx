import Layout from '@/components/layouts/admin';
import ProductsBrowser from '@/components/product/products-browser';
import { useMeQuery } from '@/data/user';
import { adminOnly } from '@/utils/auth-utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Inventaire (19/10/2026) : tableau d'inventaire avec les filtres réels du catalogue.
export default function ProductInventoryPage() {
  const { data: me } = useMeQuery();
  const shopSlug = (me as any)?.shops?.[0]?.slug;
  return <ProductsBrowser createHref={shopSlug ? `/${shopSlug}/products/create` : undefined} variant="inventory" title="Inventaire" subtitle="Quantités en stock de tout le catalogue." />;
}
ProductInventoryPage.authenticate = {
  permissions: adminOnly,
};
ProductInventoryPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
