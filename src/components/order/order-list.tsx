import Pagination from '@/components/ui/pagination';
import dayjs from 'dayjs';
import { Table } from '@/components/ui/table';
import ActionButtons from '@/components/common/action-buttons';
import usePrice from '@/utils/use-price';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Product, SortOrder, Order } from '@/types';
import { useTranslation } from 'next-i18next';
import { useIsRTL } from '@/utils/locals';
import { useState } from 'react';
import TitleWithSort from '@/components/ui/title-with-sort';
import { MappedPaginatorInfo } from '@/types';
import { NoDataFound } from '@/components/icons/no-data-found';
import { useRouter } from 'next/router';
import StatusColor from '@/components/order/status-color';
import Badge from '@/components/ui/badge/badge';
import { SUPER_ADMIN } from '@/utils/constants';
import { getAuthCredentials } from '@/utils/auth-utils';
import Avatar from '../common/avatar';
import { useCreateConversations } from '@/data/conversations';

type IProps = {
  orders: Order[] | undefined;
  paginatorInfo: MappedPaginatorInfo | null;
  onPagination: (current: number) => void;
  onSort: (current: any) => void;
  onOrder: (current: string) => void;
};

const OrderList = ({
  orders,
  paginatorInfo,
  onPagination,
  onSort,
  onOrder,
}: IProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();
  const { permissions } = getAuthCredentials();
  const { mutate: createConversations } = useCreateConversations();

  const [loading, setLoading] = useState<string | boolean | undefined>(false);
  const [sortingObj, setSortingObj] = useState<{
    sort: SortOrder;
    column: string | null;
  }>({
    sort: SortOrder.Desc,
    column: null,
  });

  const rowExpandable = (record: any) => record.children?.length;

  const onSubmit = async (shop_id: string | undefined) => {
    setLoading(shop_id);
    createConversations({ shop_id: Number(shop_id), via: 'admin' });
  };

  const onHeaderClick = (column: string | null) => ({
    onClick: () => {
      onSort((currentSortDirection: SortOrder) =>
        currentSortDirection === SortOrder.Desc
          ? SortOrder.Asc
          : SortOrder.Desc
      );
      onOrder(column!);

      setSortingObj({
        sort:
          sortingObj.sort === SortOrder.Desc
            ? SortOrder.Asc
            : SortOrder.Desc,
        column: column,
      });
    },
  });

  const columns = [
    {
      title: t('table:table-item-tracking-number'),
      dataIndex: 'tracking_number',
      key: 'tracking_number',
      align: alignLeft,
      width: 200,
      className:
        'text-[13px] md:text-sm font-semibold text-gray-700 dark:text-gray-300',
    },
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-customer')}
          ascending={
            sortingObj.sort === SortOrder.Asc &&
            sortingObj.column === 'name'
          }
          isActive={sortingObj.column === 'name'}
        />
      ),
      dataIndex: 'customer',
      key: 'name',
      align: alignLeft,
      width: 250,
      className:
        'cursor-pointer text-[13px] md:text-sm font-semibold text-gray-700 dark:text-gray-300',
      onHeaderCell: () => onHeaderClick('name'),
      render: (customer: any) => (
        <div className="flex items-center gap-3">
          <Avatar name={customer?.name} />
          <div className="flex flex-col whitespace-nowrap font-medium ms-2">
            <span>
              {customer?.name
                ? customer?.name
                : t('common:text-guest')}
            </span>
            <span className="text-[13px] font-normal text-gray-500/80">
              {customer?.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: t('table:table-item-products'),
      dataIndex: 'products',
      key: 'products',
      align: 'center',
      className:
        'hidden text-[13px] md:text-sm font-semibold text-gray-700 dark:text-gray-300',
      render: (products: Product[] | undefined) => (
        <span>{Array.isArray(products) ? products.length : 0}</span>
      ),
    },
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-order-date')}
          ascending={
            sortingObj.sort === SortOrder.Asc &&
            sortingObj.column === 'created_at'
          }
          isActive={sortingObj.column === 'created_at'}
          className="cursor-pointer"
        />
      ),
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'center',
      onHeaderCell: () => onHeaderClick('created_at'),
      className:
        'text-[13px] md:text-sm font-semibold text-gray-700 dark:text-gray-300',
      render: (date: string) => {
        dayjs.extend(relativeTime);
        dayjs.extend(utc);
        dayjs.extend(timezone);
        return (
          <span className="whitespace-nowrap">
            {dayjs
              .utc(date)
              .tz(dayjs.tz.guess())
              .fromNow()}
          </span>
        );
      },
    },
    {
      title: t('table:table-item-delivery-fee'),
      dataIndex: 'delivery_fee',
      key: 'delivery_fee',
      align: 'center',
      className:
        'text-[13px] md:text-sm font-semibold text-gray-700 dark:text-gray-300',
      render: (value: any) => {
        const { price } = usePrice({ amount: value || 0 });
        return (
          <span className="whitespace-nowrap">{price}</span>
        );
      },
    },
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-total')}
          ascending={
            sortingObj.sort === SortOrder.Asc &&
            sortingObj.column === 'total'
          }
          isActive={sortingObj.column === 'total'}
          className="cursor-pointer"
        />
      ),
      dataIndex: 'total',
      key: 'total',
      align: 'center',
      width: 120,
      onHeaderCell: () => onHeaderClick('total'),
      className:
        'text-[13px] md:text-sm font-semibold text-gray-700 dark:text-gray-300',
      render: (paid_total: any) => (
        <span className="whitespace-nowrap">
          {paid_total}$
        </span>
      ),
    },
    {
      title: t('table:table-item-status'),
      dataIndex: 'order_status',
      key: 'order_status',
      align: 'center',
      className:
        'text-[13px] md:text-sm font-semibold text-gray-700 dark:text-gray-300',
      render: (order_status: string) => (
        <Badge
          text={t(order_status)}
          color={StatusColor(order_status)}
        />
      ),
    },
    {
      title: t('table:table-item-actions'),
      dataIndex: 'id',
      key: 'actions',
      align: alignRight,
      width: 120,
      className:
        'text-[13px] md:text-sm font-semibold text-gray-700 dark:text-gray-300',
      render: (id: string, order: Order) => {
        const currentButtonLoading =
          !!loading && loading === order?.shop_id;

        return (
          <div className="flex items-center justify-end gap-2">
            {order?.children?.length ? null : (
              <>
                {permissions?.includes(SUPER_ADMIN) &&
                  order?.shop_id ? (
                  <button
                    onClick={() =>
                      onSubmit(order?.shop_id)
                    }
                    disabled={currentButtonLoading}
                    className="cursor-pointer text-accent transition-colors duration-300 hover:text-accent-hover"
                  >
                    {/* Chat Icon */}
                  </button>
                ) : null}
                <ActionButtons
                  id={id}
                  detailsUrl={`${router.asPath}/${id}`}
                  customLocale={order.language}
                />
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* EXACT SAME WRAPPER STYLE AS REVIEWLIST */}
      <div className="mb-6 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg">
        <Table
          //@ts-ignore
          columns={columns}
          data={orders}
          rowKey="id"
          scroll={{ x: 1000 }}
          expandable={{
            expandedRowRender: () => '',
            rowExpandable,
          }}
          emptyText={() => (
            <div className="flex flex-col items-center py-7">
              <NoDataFound className="w-52" />
              <div className="mb-1 pt-6 text-base font-semibold text-heading">
                {t('table:empty-table-data')}
              </div>
              <p className="text-[13px]">
                {t('table:empty-table-sorry-text')}
              </p>
            </div>
          )}
        />
      </div>

      {!!paginatorInfo?.total && (
        <div className="flex items-center justify-end rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 shadow-lg">
          <Pagination
            total={paginatorInfo?.total ?? 0}
            current={paginatorInfo?.currentPage ?? 1}
            pageSize={paginatorInfo?.perPage ?? 10} // 🔥 FIX ICI
            onChange={onPagination}
          />
        </div>
      )}
    </>
  );
};

export default OrderList;
