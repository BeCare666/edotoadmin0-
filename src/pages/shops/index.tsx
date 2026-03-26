import Layout from '@/components/layouts/admin';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ShopList from '@/components/shop/shop-list';
import ShopsAdvancedFilter, {
  type ShopsFilterValues,
} from '@/components/shop/shops-advanced-filter';
import { useState, useCallback, useMemo } from 'react';
import Search from '@/components/common/search';
import { adminOnly } from '@/utils/auth-utils';
import { useShopsQuery } from '@/data/shop';
import { SortOrder, Shop } from '@/types';
import { useRouter } from 'next/router';
import { useSettingsQuery } from '@/data/settings';

const DEFAULT_FILTERS: ShopsFilterValues = {
  isActive: undefined,
  orderBy: 'created_at',
  sortedBy: SortOrder.Desc,
  limit: 10,
};

export default function AllShopPage() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ShopsFilterValues>(DEFAULT_FILTERS);

  const { shops: rawShops, paginatorInfo, loading, error } = useShopsQuery({
    name: searchTerm,
    limit: filters.limit,
    page,
    orderBy: filters.orderBy,
    sortedBy: filters.sortedBy,
    ...(filters.isActive !== undefined &&
      filters.isActive !== null && { is_active: filters.isActive }),
  });

  const shops = useMemo(() => {
    let list = rawShops ?? [];
    if (filters.isActive !== undefined && filters.isActive !== null) {
      list = list.filter(
        (s: Shop) => Boolean(s.is_active) === filters.isActive
      );
    }
    const col = filters.orderBy ?? 'created_at';
    const dir = filters.sortedBy === SortOrder.Asc ? 1 : -1;
    return [...list].sort((a: Shop, b: Shop) => {
      const av = a[col as keyof Shop];
      const bv = b[col as keyof Shop];
      if (av == null && bv == null) return 0;
      if (av == null) return dir;
      if (bv == null) return -dir;
      if (typeof av === 'string' && typeof bv === 'string')
        return dir * av.localeCompare(bv);
      if (typeof av === 'number' && typeof bv === 'number')
        return dir * (av - bv);
      return 0;
    });
  }, [rawShops, filters.isActive, filters.orderBy, filters.sortedBy]);

  const { settings, loading: loadingSettings } = useSettingsQuery({
    language: locale!,
  });

  const handleSearch = useCallback(({ searchText }: { searchText: string }) => {
    setSearchTerm(searchText);
    setPage(1);
  }, []);

  const handlePagination = useCallback((current: number) => {
    setPage(current);
  }, []);

  const handleFilterChange = useCallback((newFilters: ShopsFilterValues) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  if (loading || loadingSettings)
    return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <>
      {/* En-tête B Space – design visible */}
      <div className="mb-6 rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-6 shadow-md">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              {t('common:sidebar-nav-item-shops')}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Gestion des B Spaces (Business Space) – boutiques et vendeurs
            </p>
          </div>
          <div className="flex w-full min-w-0 sm:w-80">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-name')}
            />
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <ShopsAdvancedFilter
        values={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        className="mb-6"
      />

      <ShopList
        shops={shops}
        paginatorInfo={paginatorInfo}
        onPagination={handlePagination}
        onOrder={(column) =>
          handleFilterChange({ ...filters, orderBy: column })
        }
        onSort={(getNewDirection) =>
          handleFilterChange({
            ...filters,
            sortedBy: getNewDirection(filters.sortedBy),
          })
        }
        isMultiCommissionRate={Boolean(
          settings?.options?.isMultiCommissionRate,
        )}
        showTransferOwnership={false}
      />
    </>
  );
}
AllShopPage.authenticate = {
  permissions: adminOnly,
};
AllShopPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
