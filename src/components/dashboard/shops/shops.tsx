import { useRouter } from 'next/router';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { useMeQuery } from '@/data/user';
import ShopCard from '@/components/shop/shop-card';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import NotFound from '@/components/ui/not-found';
import { isEmpty } from 'lodash';

const ShopCardSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-pulse">
      <div className="w-full max-w-3xl md:max-w-4xl lg:max-w-5xl">
        <div className="w-full h-[500px] md:h-[600px] lg:h-[700px] bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>

      <div className="mt-8 w-60 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  );
};

const ShopList = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading: loading, error } = useMeQuery();
  const { permissions } = getAuthCredentials();
  const permission = hasAccess(adminOnly, permissions);

  if (loading) return <ShopCardSkeleton />;
  if (error) return <ErrorMessage message={error.message} />;

  // On récupère seulement le premier shop
  const firstShop = data?.shops?.[0] || data?.managed_shop;

  if (!firstShop) {
    return (
      <NotFound
        image="/no-shop-found.svg"
        text="text-no-shop-found"
        className="mx-auto w-7/12"
      />
    );
  } else {
    router.push(`/${firstShop.slug}`);
  }

  return (
    <div className="hidden flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-heading mb-8">
        {t('common:sidebar-nav-item-my-shops')}
      </h1>

      <div className="w-full max-w-3xl md:max-w-4xl lg:max-w-5xl">
        <ShopCard
          shop={firstShop}
          className="w-full h-[500px] md:h-[600px] lg:h-[700px]"
        />
      </div>

      <button
        onClick={() => router.push(`/${firstShop.slug}`)}
        className="mt-8 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition"
      >
        {t('Visiter maintenant votre shop')}
      </button>
    </div>
  );
};

export default ShopList;
