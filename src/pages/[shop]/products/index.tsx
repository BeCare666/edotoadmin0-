import ShopLayout from '@/components/layouts/shop';
import ProductsBrowser from '@/components/product/products-browser';
import Loader from '@/components/ui/loader/loader';
import { Routes } from '@/config/routes';
import { useShopQuery } from '@/data/shop';
import { useMeQuery } from '@/data/user';
import {
  adminOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Produits d'une boutique, avec les mêmes filtres réels que la liste globale
export default function ProductsPage() {
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const { shop } = router.query;
  const { t } = useTranslation();
  const { data: shopData, isLoading: fetchingShop } = useShopQuery({
    slug: shop as string,
  });
  const shopId = shopData?.id!;

  const denied =
    Boolean(shopId) &&
    Boolean(me) &&
    !hasAccess(adminOnly, permissions) &&
    !me?.shops?.map((s) => s.id).includes(shopId) &&
    me?.managed_shop?.id != shopId;

  useEffect(() => {
    if (denied) router.replace(Routes.dashboard);
  }, [denied, router]);

  if (fetchingShop || !shopId) return <Loader text={t('common:text-loading')} />;

  return <ProductsBrowser shopId={shopId} createHref={`/${shop}/products/create`} />;
}
ProductsPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
ProductsPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
