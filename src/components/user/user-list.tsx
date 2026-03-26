import Pagination from '@/components/ui/pagination';
import Image from 'next/image';
import { Table } from '@/components/ui/table';
import ActionButtons from '@/components/common/action-buttons';
import { siteSettings } from '@/settings/site.settings';
import {
  Category,
  MappedPaginatorInfo,
  SortOrder,
  User,
  UserPaginator,
} from '@/types';
import { useMeQuery } from '@/data/user';
import { useTranslation } from 'next-i18next';
import { useIsRTL } from '@/utils/locals';
import { useState } from 'react';
import TitleWithSort from '@/components/ui/title-with-sort';
import { NoDataFound } from '@/components/icons/no-data-found';
import Avatar from '@/components/common/avatar';
import Badge from '@/components/ui/badge/badge';

type IProps = {
  customers: User[] | undefined;
  paginatorInfo: MappedPaginatorInfo | null;
  onPagination: (current: number) => void;
  onSort: (current: any) => void;
  onOrder: (current: string) => void;
};

const UserList = ({
  customers,
  paginatorInfo,
  onPagination,
  onSort,
  onOrder,
}: IProps) => {
  const { t } = useTranslation();
  const { alignLeft } = useIsRTL();

  const [sortingObj, setSortingObj] = useState<{
    sort: SortOrder;
    column: any | null;
  }>({
    sort: SortOrder.Desc,
    column: null,
  });

  const onHeaderClick = (column: any | null) => ({
    onClick: () => {
      onSort((currentSortDirection: SortOrder) =>
        currentSortDirection === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc
      );

      onOrder(column);

      setSortingObj({
        sort:
          sortingObj.sort === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
        column: column,
      });
    },
  });

  const columns = [
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-id')}
          ascending={
            sortingObj.sort === SortOrder.Asc && sortingObj.column === 'id'
          }
          isActive={sortingObj.column === 'id'}
        />
      ),
      className: 'cursor-pointer',
      dataIndex: 'id',
      key: 'id',
      align: alignLeft,
      width: 140,
      onHeaderCell: () => onHeaderClick('id'),
      render: (id: number) => (
        <>
          <div className="flex justify-start w-full">
            <span className="font-mono text-sm font-semibold text-gray-800">
              #{t('table:table-item-id')}: {id}
            </span>
          </div>
        </>
      ),
    },

    {
      title: (
        <TitleWithSort
          title={t('table:table-item-title')}
          ascending={
            sortingObj.sort === SortOrder.Asc && sortingObj.column === 'id'
          }
          isActive={sortingObj.column === 'id'}
        />
      ),
      className: 'cursor-pointer',
      dataIndex: 'name',
      key: 'name',
      align: alignLeft,
      width: 300,
      ellipsis: true,
      onHeaderCell: () => onHeaderClick('name'),
      render: (
        name: string,
        { profile, email }: { profile: any; email: string }
      ) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          <Avatar
            name={name}
            src={profile?.avatar?.thumbnail}
            className="!h-10 !w-10 ring-2 ring-white shadow-sm"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="truncate font-semibold text-gray-900 text-left">
              {name}
            </span>
            <span className="truncate text-xs text-gray-500">
              {email}
            </span>
          </div>
        </div>
      ),
    },

    {
      title: t('table:table-item-permissions'),
      dataIndex: 'permissions',
      key: 'permissions',
      align: alignLeft,
      width: 360,
      render: (permissions: any, record: any) => {
        const role = record?.role ?? record?.roles?.[0];

        const permList = Array.isArray(permissions)
          ? permissions
            .map((p: any) =>
              typeof p === 'string'
                ? p
                : p?.name ?? p?.title ?? ''
            )
            .filter(Boolean)
          : [];

        return (
          <div className="flex flex-col gap-2">
            {role != null && String(role).trim() !== '' && (
              <span className="inline-block w-fit rounded-full bg-indigo-100 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
                {typeof role === 'string'
                  ? role
                  : (role as any)?.name ?? String(role)}
              </span>
            )}

            <div className="flex flex-wrap gap-2">
              {permList.map((name: string, index: number) => (
                <span
                  key={index}
                  className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        );
      },
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
      width: 150,
      className: 'cursor-pointer',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center',
      onHeaderCell: () => onHeaderClick('is_active'),
      render: (is_active: boolean) => (
        <Badge
          textKey={is_active ? 'common:text-active' : 'common:text-inactive'}
          color={
            is_active
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          }
        />
      ),
    },

    {
      title: t('table:table-item-actions'),
      dataIndex: 'id',
      key: 'actions',
      align: 'right',
      width: 160,
      render: function Render(id: string, { is_active }: any) {
        const { data } = useMeQuery();
        return (
          <>
            {data?.id != id && (
              <ActionButtons
                id={id}
                userStatus={true}
                isUserActive={is_active}
                showAddWalletPoints={false}
                showMakeAdminButton={true}
              />
            )}
          </>
        );
      },
    },
  ];

  return (
    <>
      {/* ===== TABLE WRAPPER PREMIUM ===== */}
      <div className="b-space-table-wrapper mb-6 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg">
        <Table
          // @ts-ignore
          className="b-space-table"
          columns={columns}
          emptyText={() => (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <NoDataFound className="h-40 w-40 text-gray-300" />
              <div className="mt-6 text-base font-semibold text-gray-700">
                {t('table:empty-table-data')}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {t('table:empty-table-sorry-text')}
              </p>
            </div>
          )}
          data={customers as any}
          rowKey="id"
          scroll={{ x: 1100 }}
        />
      </div>

      {/* ===== PAGINATION PREMIUM ===== */}
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

export default UserList;
