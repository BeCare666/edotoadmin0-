import { useEffect, useState } from 'react';
import ColumnChart from '@/components/widgets/column-chart';
import StickerCard from '@/components/widgets/sticker-card';
import {
  useAnalyticsQuery,
  useProductByCategoryQuery,
  useTopRatedProductsQuery,
} from '@/data/dashboard';
import {
  adminOnly,
  adminAndOwnerOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import usePrice from '@/utils/use-price';
import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { EaringIcon } from '@/components/icons/summary/earning';
import { ShoppingIcon } from '@/components/icons/summary/shopping';
import { ChecklistIcon } from '@/components/icons/summary/checklist';
import { BasketIcon } from '@/components/icons/summary/basket';
import Button from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useMeQuery } from '@/data/user';
import PageHeading from '@/components/common/page-heading';
import DashboardHeader from './dashboardHeader';
const ShopList = dynamic(() => import('@/components/dashboard/shops/shops'));

const Message = dynamic(() => import('@/components/dashboard/shops/message'));
const StoreNotices = dynamic(
  () => import('@/components/dashboard/shops/store-notices'),
);
const OrderStatusWidget = dynamic(
  () => import('@/components/dashboard/widgets/box/widget-order-by-status'),
);
const ProductCountByCategory = dynamic(
  () =>
    import(
      '@/components/dashboard/widgets/table/widget-product-count-by-category'
    ),
);

const TopRatedProducts = dynamic(
  () => import('@/components/dashboard/widgets/box/widget-top-rate-product'),
);

const OwnerShopLayout = () => {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data, isLoading: loading } = useAnalyticsQuery();
  const [activeTimeFrame, setActiveTimeFrame] = useState(1);
  const [orderDataRange, setOrderDataRange] = useState<any>(null);

  const { data: datax } = useMeQuery();
  const shops = datax?.shops || [];
  // Debug pour voir ce que renvoie ton backend
  useEffect(() => {
    console.log('📊 Analytics data (keys): ', data);
    //console.log('📊 Analytics full JSON:', JSON.stringify(data, null, 2));
  }, [data]);
  const {
    data: productByCategory,
    isLoading: productByCategoryLoading,
  } = useProductByCategoryQuery({ limit: 10, language: locale });

  const {
    data: topRatedProducts,
    isLoading: topRatedProductsLoading,
  } = useTopRatedProductsQuery({ limit: 10, language: locale });

  const { price: total_revenue } = usePrice(
    data ? { amount: Number(data.totalRevenue) } : { amount: 0 },
  );
  const { price: totalOrders } = usePrice(
    data ? { amount: Number(data.totalOrders) } : { amount: 0 },
  );
  const cleanNumber = Number(String(totalOrders).replace(/[^0-9.-]+/g, ""));
  const { price: todays_revenue } = usePrice(
    data ? { amount: Number(data.todaysRevenue) } : { amount: 0 },
  );

  const { price: total_shops } = usePrice(
    data ? { amount: Number(data.totalShops) } : { amount: 0 },
  );

  let salesByYear: number[] = Array.from({ length: 12 }, () => 0);
  if (Array.isArray(data?.totalYearSaleByMonth) && data?.totalYearSaleByMonth.length) {
    salesByYear = data.totalYearSaleByMonth.map((item: any) =>
      Number(item.total).toFixed ? Number(item.total).toFixed(2) : 0,
    );
  }

  const timeFrame = [
    { name: t('text-today'), day: 1 },
    { name: t('text-weekly'), day: 7 },
    { name: t('text-monthly'), day: 30 },
    { name: t('text-yearly'), day: 365 },
  ];

  // Fix du useEffect pour bien prendre monthly et yearly
  useEffect(() => {
    if (!data) return;
    switch (activeTimeFrame) {
      case 1:
        setOrderDataRange(data?.todayTotalOrderByStatus);
        break;
      case 7:
        setOrderDataRange(data?.weeklyTotalOrderByStatus);
        break;
      case 30:
        setOrderDataRange(data?.monthlyTotalOrderByStatus);
        break;
      case 365:
        setOrderDataRange(data?.yearlyTotalOrderByStatus);
        break;
      default:
        setOrderDataRange(data?.todayTotalOrderByStatus);
        break;
    }
    //console.log('📊 Analytics data : ', data);
  }, [activeTimeFrame, data]);

  if (loading) return <div className="text-gray-500">⏳ Chargement des analytics...</div>;
  if (!data) return <div className="text-gray-500">⚠️ Aucune donnée analytics trouvée.</div>;
  console.log("data", data.shops)
  return (
    <>
      <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg md:p-10">
        <div className="lg:mb-3">
          <DashboardHeader
            actionTitle="Créer une nouvelle boutique"
            actionDescription="Ajoutez votre boutique et commencez à vendre."
            onActionClick={() => router.push(`/shops/create`)}
          />
        </div>
        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('text-summary')}
          </h2>
        </div>

        {/* Grid */}
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StickerCard
            titleTransKey="Revenu total"
            price={total_revenue}
            //note="janvier 2024"
            color="#7C3AED"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m0 0l3-3m-3 3l-3-3" /></svg>}
          />
          <StickerCard
            titleTransKey="Revenu du jour"
            price={todays_revenue}
            //note="juillet 2024"
            color="#EC4899"
            // indicator="down"
            //indicatorText="-5%"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m0 0l3-3m-3 3l-3-3" /></svg>}
          />
          <StickerCard
            titleTransKey="Commandes totales"
            price={totalOrders}
            //note="août 2024"
            color="#0EA5E9"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18M3 9h18M3 15h18M3 21h18" /></svg>}
          />


          <StickerCard
            titleTransKey="Commandes totales"
            price={Math.round(cleanNumber)}
            //note="mai 2024"
            color="#F97316"
            //indicator="up"
            //indicatorText="+12%"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18M3 16h18M5 12h14" /></svg>}
          />
        </div>
      </div>

      <div className="hidden mb-8 rounded-lg bg-light p-5 md:p-8">
        <div className="mb-5 items-center justify-between sm:flex md:mb-7">
          <PageHeading title={t('text-order-status')} />
          <div className="mt-3.5 inline-flex rounded-full bg-gray-100/80 p-1.5 sm:mt-0">
            {timeFrame.map((time) => (
              <div key={time.day} className="relative">
                <Button
                  className={cn(
                    '!focus:ring-0  relative z-10 !h-7 rounded-full !px-2.5 text-sm font-medium text-gray-500',
                    time.day === activeTimeFrame ? 'text-accent' : '',
                  )}
                  type="button"
                  onClick={() => setActiveTimeFrame(time.day)}
                  variant="custom"
                >
                  {time.name}
                </Button>
                {time.day === activeTimeFrame ? (
                  <motion.div className="absolute bottom-0 left-0 right-0 z-0 h-full rounded-3xl bg-accent/10" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <OrderStatusWidget
          order={orderDataRange}
          timeFrame={activeTimeFrame}
          allowedStatus={['pending', 'processing', 'complete', 'cancel']}
        />
      </div>

      {hasAccess(adminAndOwnerOnly, permissions) && (
        <div className="mb-8 flex w-full flex-wrap md:flex-nowrap ">
          <ColumnChart
            widgetTitle={t('common:sale-history')}
            colors={['#6073D4']}
            series={salesByYear}
            categories={[
              t('common:january'),
              t('common:february'),
              t('common:march'),
              t('common:april'),
              t('common:may'),
              t('common:june'),
              t('common:july'),
              t('common:august'),
              t('common:september'),
              t('common:october'),
              t('common:november'),
              t('common:december'),
            ]}
          />
        </div>
      )}

      <div className="hidden grid gap-8 xl:grid-cols-12">
        <TopRatedProducts
          products={topRatedProducts}
          title={'text-most-rated-products'}
          className="xl:col-span-5 2xl:me-20"
        />
        <ProductCountByCategory
          products={productByCategory}
          title={'text-most-category-products'}
          className="xl:col-span-7 2xl:ltr:-ml-20 2xl:rtl:-mr-20"
        />
      </div>
    </>
  );
};

const OwnerDashboard = () => {
  const { permissions } = getAuthCredentials();
  let permission = hasAccess(adminOnly, permissions);

  return permission ? <ShopList /> : <OwnerShopLayout />;
};

export default OwnerDashboard;
