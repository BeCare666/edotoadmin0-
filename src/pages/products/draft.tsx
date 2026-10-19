import Layout from '@/components/layouts/admin';
import ProductsBrowser from '@/components/product/products-browser';
import { useMeQuery } from '@/data/user';
import { adminOnly } from '@/utils/auth-utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Brouillons (19/10/2026) : liste filtrable commune limitée au statut brouillon.
export default function DraftProductPage() {
  const { data: me } = useMeQuery();
  const shopSlug = (me as any)?.shops?.[0]?.slug;
  return <ProductsBrowser createHref={shopSlug ? `/${shopSlug}/products/create` : undefined} fixedFilters={{ status: 'draft' }} title="Produits en brouillon" subtitle="Produits pas encore publiés." />;
}
DraftProductPage.authenticate = {
  permissions: adminOnly,
};
DraftProductPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
