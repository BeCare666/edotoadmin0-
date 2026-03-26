import RecentOrders from '@/components/order/recent-orders';
import { motion } from 'framer-motion';
import PopularProductList from '@/components/product/popular-product-list';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import ColumnChart from '@/components/widgets/column-chart';
import StickerCard from '@/components/widgets/sticker-card';
import WithdrawTable from '@/components/withdraw/withdraw-table';
import Button from '@/components/ui/button';
import {
  useAnalyticsQuery,
  usePopularProductsQuery,
  useLowProductStockQuery,
  useProductByCategoryQuery,
  useTopRatedProductsQuery,
} from '@/data/dashboard';
import { useOrdersQuery } from '@/data/order';
import { useWithdrawsQuery } from '@/data/withdraw';
import usePrice from '@/utils/use-price';
import { useTranslation } from 'next-i18next';
import cn from 'classnames';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import LowStockProduct from '@/components/product/product-stock';
import { useEffect, useState } from 'react';
import { EaringIcon } from '@/components/icons/summary/earning';
import { ShoppingIcon } from '@/components/icons/summary/shopping';
import { BasketIcon } from '@/components/icons/summary/basket';
import { ChecklistIcon } from '@/components/icons/summary/checklist';
import Search from '@/components/common/search';
import DashboardHeader from './dashboardHeader';
// const TotalOrderByStatus = dynamic(
//   () => import('@/components/dashboard/total-order-by-status')
// );
// const WeeklyDaysTotalOrderByStatus = dynamic(
//   () => import('@/components/dashboard/total-order-by-status')
// );
// const MonthlyTotalOrderByStatus = dynamic(
//   () => import('@/components/dashboard/total-order-by-status')
// );

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

export default function Dashboard() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const router = useRouter();
  const { data, isLoading: loading } = useAnalyticsQuery();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTimeFrame, setActiveTimeFrame] = useState(1);
  const [orderDataRange, setOrderDataRange] = useState(
    data?.todayTotalOrderByStatus,
  );

  const { price: total_revenue } = usePrice(
    data ? { amount: Number(data.totalRevenue) } : { amount: 0 },
  );
  const { price: total_refund } = usePrice(
    data ? { amount: Number(data.totalRefunds) } : { amount: 0 },
  );
  const { price: todays_revenue } = usePrice(
    data ? { amount: Number(data.todaysRevenue) } : { amount: 0 },
  );

  const { price: total_orders } = usePrice(
    data ? { amount: Number(data.totalOrders) } : { amount: 0 },
  );
  const cleanNumber = Number(String(total_orders).replace(/[^0-9.-]+/g, ""));
  console.log("cleanNumber data", data);
  const {
    error: orderError,
    orders: orderData,
    loading: orderLoading,
    paginatorInfo: orderPaginatorInfo,
  } = useOrdersQuery({
    language: locale,
    limit: 5,
    page,
    tracking_number: searchTerm,
  });
  const {
    data: popularProductData,
    isLoading: popularProductLoading,
    error: popularProductError,
  } = usePopularProductsQuery({ limit: 10, language: locale });

  const {
    data: topRatedProducts,
    isLoading: topRatedProductsLoading,
    error: topRatedProductsError,
  } = useTopRatedProductsQuery({ limit: 10, language: locale });

  const {
    data: lowStockProduct,
    isLoading: lowStockProductLoading,
    error: lowStockProductError,
  } = useLowProductStockQuery({
    limit: 10,
    language: locale,
  });

  const {
    data: productByCategory,
    isLoading: productByCategoryLoading,
    error: productByCategoryError,
  } = useProductByCategoryQuery({ limit: 10, language: locale });

  const {
    withdraws,
    loading: withdrawLoading,
    paginatorInfo: withdrawPaginatorInfo,
  } = useWithdrawsQuery({
    limit: 10,
  });

  let salesByYear: number[] = Array.from({ length: 12 }, (_) => 0);
  if (!!data?.totalYearSaleByMonth?.length) {
    salesByYear = data.totalYearSaleByMonth.map((item: any) =>
      item.total.toFixed(2),
    );
  }
  console.log("salesByYear", salesByYear);
  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  const timeFrame = [
    { name: t('text-today'), day: 1 },
    { name: t('text-weekly'), day: 7 },
    { name: t('text-monthly'), day: 30 },
    { name: t('text-yearly'), day: 365 },
  ];

  useEffect(() => {
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
        setOrderDataRange(orderDataRange);
        break;
    }
  });

  if (
    loading ||
    orderLoading ||
    popularProductLoading ||
    withdrawLoading ||
    topRatedProductsLoading
  ) {
    return <Loader text={t('common:text-loading')} />;
  }
  if (orderError || popularProductError || topRatedProductsError) {
    return (
      <ErrorMessage
        message={
          orderError?.message ||
          popularProductError?.message ||
          topRatedProductsError?.message
        }
      />
    );
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Hero + CTA */}
      <div className="card-premium p-7 md:p-8 lg:p-9 hover-lift">
        <DashboardHeader
          actionTitle={t('common:text-create-shop')}
          actionDescription={t('common:text-dashboard-create-shop-description')}
          onActionClick={() => router.push(`/shops/create`)}
          showCreateShopCTA={false}
        />
      </div>

      {/* Bento: 4 KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-premium p-6 hover-lift">
          <StickerCard
            titleTransKey={t('common:total-revenue')}
            price={total_revenue}
            color="#7C3AED"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m0 0l3-3m-3 3l-3-3" /></svg>}
          />
        </div>
        <div className="card-premium p-6 lg:p-7 hover-lift">
          <StickerCard
            titleTransKey={t('common:today-revenue')}
            price={todays_revenue}
            color="#EC4899"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m0 0l3-3m-3 3l-3-3" /></svg>}
          />
        </div>
        <div className="card-premium p-6 lg:p-7 hover-lift">
          <StickerCard
            titleTransKey={t('common:refunds')}
            price={total_refund}
            color="#0EA5E9"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18M3 9h18M3 15h18M3 21h18" /></svg>}
          />
        </div>
        <div className="card-premium p-6 hover-lift">
          <StickerCard
            titleTransKey={t('common:total-orders')}
            price={cleanNumber}
            color="#F97316"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18M3 16h18M5 12h14" /></svg>}
          />
        </div>
      </div>

      {/* Chart + Recent Orders */}

      <div className="mb-8 flex w-full flex-wrap md:flex-nowrap">
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
      <div className="mb-8 flex w-full flex-wrap md:flex-nowrap hidden">
        <RecentOrders
          className="card-premium overflow-hidden"
          orders={orderData}
          paginatorInfo={orderPaginatorInfo}
          title={t('table:recent-order-table-title')}
          onPagination={handlePagination}
          searchElement={
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-name')}
              className="hidden max-w-sm sm:inline-block [&button]:top-0.5"
              inputClassName="!h-10"
            />
          }
        />
      </div>


      {/* Bento: Alertes stock + Top produits + Catégories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 hidden">
        <div className="lg:col-span-4">
          <LowStockProduct
            //@ts-ignore
            products={lowStockProduct}
            title={'text-low-stock-products'}
            paginatorInfo={withdrawPaginatorInfo}
            onPagination={handlePagination}
            className="card-premium overflow-hidden hover-lift"
            searchElement={
              <Search
                onSearch={handleSearch}
                placeholderText={t('form:input-placeholder-search-name')}
                className="hidden max-w-sm sm:inline-block"
                inputClassName="!h-10"
              />
            }
          />
        </div>
        <div className="lg:col-span-4">
          <TopRatedProducts
            products={topRatedProducts}
            title={'text-most-rated-products'}
            className="card-premium overflow-hidden hover-lift"
          />
        </div>
        <div className="lg:col-span-4">
          <PopularProductList
            products={popularProductData}
            title={t('table:popular-products-table-title')}
            className="card-premium overflow-hidden hover-lift"
          />
        </div>
      </div>

      {/* Bento: Catégories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 hidden">
        <div className="lg:col-span-12">
          <ProductCountByCategory
            products={productByCategory}
            title={'text-most-category-products'}
            className="card-premium overflow-hidden hover-lift"
          />
        </div>
        <div className="lg:col-span-5 hidden">
          <WithdrawTable
            withdraws={withdraws}
            title={t('table:withdraw-table-title')}
            paginatorInfo={withdrawPaginatorInfo}
            onPagination={handlePagination}
            className="card-premium overflow-hidden hover-lift"
          />
        </div>
      </div>
      {/* Bento: Retraits */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 hidden">
        <div className="lg:col-span-12 hidden">
          <ProductCountByCategory
            products={productByCategory}
            title={'text-most-category-products'}
            className="card-premium overflow-hidden hover-lift"
          />
        </div>
        <div className="lg:col-span-12 ">
          <WithdrawTable
            withdraws={withdraws}
            title={t('table:withdraw-table-title')}
            paginatorInfo={withdrawPaginatorInfo}
            onPagination={handlePagination}
            className="card-premium overflow-hidden hover-lift"
          />
        </div>
      </div>
    </div>
  );
}
