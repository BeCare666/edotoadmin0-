import ActionButtons from '@/components/common/action-buttons';
import Avatar from '@/components/common/avatar';
import { NoDataFound } from '@/components/icons/no-data-found';
import Badge from '@/components/ui/badge/badge';
import Link from '@/components/ui/link';
import Pagination from '@/components/ui/pagination';
import { AlignType, Table } from '@/components/ui/table';
import TitleWithSort from '@/components/ui/title-with-sort';
import { ShopLogoTableCell } from '@/components/shop/shop-logo-table-cell';
import { siteSettings } from '@/settings/site.settings';
import {
  MappedPaginatorInfo,
  OwnerShipTransferStatus,
  Shop,
  SortOrder,
} from '@/types';
import { OWNERSHIP_TRANSFER_STATUS } from '@/utils/constants';
import { useIsRTL } from '@/utils/locals';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { getAuthCredentials } from '@/utils/auth-utils';
import { SUPER_ADMIN } from '@/utils/constants';

type IProps = {
  shops: Shop[] | undefined;
  paginatorInfo: MappedPaginatorInfo | null;
  onPagination: (current: number) => void;
  onSort: (current: any) => void;
  onOrder: (current: string) => void;
  isMultiCommissionRate?: boolean;
  /** Masquer l’icône de transfert de propriété (ex. page B Space /shops) */
  showTransferOwnership?: boolean;
};

const ShopList = ({
  shops,
  paginatorInfo,
  onPagination,
  onSort,
  onOrder,
  isMultiCommissionRate,
  showTransferOwnership = true,
}: IProps) => {
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();
  const { permissions } = getAuthCredentials();
  const [sortingObj, setSortingObj] = useState<{
    sort: SortOrder;
    column: string | null;
  }>({
    sort: SortOrder.Desc,
    column: null,
  });

  const onHeaderClick = (column: string | null) => ({
    onClick: () => {
      onSort((currentSortDirection: SortOrder) =>
        currentSortDirection === SortOrder.Desc
          ? SortOrder.Asc
          : SortOrder.Desc,
      );
      onOrder(column!);

      setSortingObj({
        sort:
          sortingObj.sort === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
        column: column,
      });
    },
  });

  let columns = [
    {
      title: t('table:table-item-id'),
      dataIndex: 'id',
      key: 'id',
      align: alignLeft as AlignType,
      width: 130,
      render: (id: number) => `#${t('table:table-item-id')}: ${id}`,
    },
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-shop')}
          ascending={
            sortingObj.sort === SortOrder.Asc && sortingObj.column === 'name'
          }
          isActive={sortingObj.column === 'name'}
        />
      ),
      dataIndex: 'name',
      key: 'name',
      align: alignLeft as AlignType,
      width: 250,
      className: 'cursor-pointer',
      onHeaderCell: () => onHeaderClick('name'),
      render: (name: any, record: Shop) => (
        <div className="flex items-center gap-3">
          <ShopLogoTableCell record={record} name={name} />
          <Link href={`/${record.slug}`}>
            <span className="truncate whitespace-nowrap font-medium text-gray-900 hover:text-accent transition-colors">
              {name}
            </span>
          </Link>
        </div>
      ),
    },

    {
      title: (
        <TitleWithSort
          title={t('table:table-item-total-products')}
          ascending={
            sortingObj.sort === SortOrder.Asc &&
            sortingObj.column === 'products_count'
          }
          isActive={sortingObj.column === 'products_count'}
        />
      ),
      className: 'cursor-pointer',
      dataIndex: 'products_count',
      key: 'products_count',
      align: 'center' as AlignType,
      width: 180,
      onHeaderCell: () => onHeaderClick('products_count'),
    },

    {
      title: (
        <TitleWithSort
          title={t('table:table-item-total-orders')}
          ascending={
            sortingObj.sort === SortOrder.Asc &&
            sortingObj.column === 'orders_count'
          }
          isActive={sortingObj.column === 'orders_count'}
        />
      ),
      className: 'cursor-pointer',
      dataIndex: 'orders_count',
      key: 'orders_count',
      align: 'center' as AlignType,
      onHeaderCell: () => onHeaderClick('orders_count'),
      width: 180,
    },
    {
      title: t('table:table-item-owner-name'),
      dataIndex: 'owner',
      key: 'owner',
      align: alignLeft as AlignType,
      width: 250,
      render: (owner: any) => (
        <div className="flex items-center">
          <Avatar name={owner?.name} src={owner?.profile?.avatar?.thumbnail} />
          <span className="whitespace-nowrap font-medium ms-2">
            {owner?.name}
          </span>
        </div>
      ),
    },
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-status')}
          ascending={
            sortingObj.sort === SortOrder.Asc &&
            sortingObj.column === 'is_active'
          }
          isActive={sortingObj.column === 'is_active'}
        />
      ),
      className: 'cursor-pointer',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center' as AlignType,
      width: 150,
      onHeaderCell: () => onHeaderClick('is_active'),
      render: (is_active: boolean) => (
        <Badge
          textKey={is_active ? 'common:text-active' : 'common:text-inactive'}
          color={
            is_active
              ? 'bg-accent/10 !text-accent'
              : 'bg-status-failed/10 text-status-failed'
          }
        />
      ),
    },
    {
      title: t('text-quote-title'),
      key: 'settings',
      align: 'center' as AlignType,
      width: 80,
      render: (id: string, { settings, is_active }: Shop) => {
        return Boolean(settings?.askForAQuote?.enable) &&
          !Boolean(is_active) &&
          Boolean(isMultiCommissionRate) ? (
          <Badge
            textKey={settings?.askForAQuote?.quote}
            color="bg-accent/10 text-accent"
          />
        ) : (
          ''
        );
      },
    },
    {
      title: t('table:table-item-actions'),
      dataIndex: 'id',
      key: 'actions',
      align: alignRight as AlignType,
      width: 120,
      render: (id: string, record: Shop) => {
        const { slug, is_active, owner_id, ownership_history, settings } = record;
        return (
          <ActionButtons
            id={id}
            approveButton={true}
            detailsUrl={`/${slug}`}
            isShopActive={is_active}
            transferShopOwnership={showTransferOwnership}
            shopRecord={record}
            disabled={
              !Boolean(is_active) ||
              OWNERSHIP_TRANSFER_STATUS?.includes(
                ownership_history?.status as OwnerShipTransferStatus,
              )
            }
            data={{
              ...settings?.askForAQuote,
              multiCommission: Boolean(isMultiCommissionRate),
              id,
              owner_id: owner_id as number,
            }}
          />
        );
      },
    },
  ];

  if (!Boolean(isMultiCommissionRate)) {
    columns = columns?.filter((column) => column?.key !== 'settings');
  }

  if (!permissions?.includes(SUPER_ADMIN)) {
    columns = columns?.filter((column) => column?.key !== 'actions');
  }

  return (
    <>
      {/* Tableau classique B Space – design pro visible */}
      <div className="b-space-table-wrapper mb-6 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg">
        <Table
          className="b-space-table"
          columns={columns}
          emptyText={() => (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <NoDataFound className="h-40 w-40 text-gray-300" />
              <p className="mt-6 text-base font-semibold text-gray-700">
                {t('table:empty-table-data')}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {t('table:empty-table-sorry-text')}
              </p>
            </div>
          )}
          data={shops}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </div>

      {!!paginatorInfo?.total && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 shadow-md">
          <span className="text-sm font-semibold text-slate-600">
            {t('table:table-item-total')}: {paginatorInfo.total}
          </span>
          <Pagination
            total={paginatorInfo.total}
            current={paginatorInfo.currentPage}
            pageSize={paginatorInfo.perPage}
            onChange={onPagination}
          />
        </div>
      )}
    </>
  );
};

export default ShopList;
