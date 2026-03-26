import ActionButtons from '@/components/common/action-buttons';
import Avatar from '@/components/common/avatar';
import { NoDataFound } from '@/components/icons/no-data-found';
import Badge from '@/components/ui/badge/badge';
import Pagination from '@/components/ui/pagination';
import { AlignType, Table } from '@/components/ui/table';
import TitleWithSort from '@/components/ui/title-with-sort';
import {
  MappedPaginatorInfo,
  SortOrder,
  User,
} from '@/types';
import { useMeQuery } from '@/data/user';
import { useIsRTL } from '@/utils/locals';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';

type IProps = {
  admins: User[] | undefined;
  paginatorInfo: MappedPaginatorInfo | null;
  onPagination: (current: number) => void;
  onSort: (current: any) => void;
  onOrder: (current: string) => void;
};

const AdminsList = ({
  admins,
  paginatorInfo,
  onPagination,
  onSort,
  onOrder,
}: IProps) => {
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();

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
          : SortOrder.Desc
      );

      onOrder(column!);

      setSortingObj({
        sort:
          sortingObj.sort === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
        column: column,
      });
    },
  });

  const columns = [
    // =========================
    // ID
    // =========================
    {
      title: t('table:table-item-id'),
      dataIndex: 'id',
      key: 'id',
      align: alignLeft as AlignType,
      width: 120,
      render: (id: number) => (
        <span className="font-mono text-sm font-semibold text-gray-800">
          #{id}
        </span>
      ),
    },

    // =========================
    // USER
    // =========================
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-title')}
          ascending={
            sortingObj.sort === SortOrder.Asc && sortingObj.column === 'name'
          }
          isActive={sortingObj.column === 'name'}
        />
      ),
      dataIndex: 'name',
      key: 'name',
      align: alignLeft as AlignType,
      width: 300,
      className: 'cursor-pointer',
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
            <span className="truncate font-semibold text-gray-900">
              {name}
            </span>
            <span className="truncate text-xs text-gray-500">
              {email}
            </span>
          </div>
        </div>
      ),
    },

    // =========================
    // PERMISSIONS
    // =========================
 
{
  title: (
    <TitleWithSort
      title={t('table:table-item-permissions')}
      ascending={
        sortingObj.sort === SortOrder.Asc &&
        sortingObj.column === 'role'
      }
      isActive={sortingObj.column === 'role'}
    />
  ),
  dataIndex: 'role',
  key: 'role',
  align: 'center' as AlignType,
  width: 180,
  className: 'cursor-pointer',
  onHeaderCell: () => onHeaderClick('role'),
  render: (role: string) => {
    const roleStyle: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
      admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      manager: 'bg-blue-100 text-blue-700 border-blue-200',
      staff: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    const style =
      roleStyle[role?.toLowerCase()] ||
      'bg-gray-100 text-gray-700 border-gray-200';

    return (
      <span
        className={`
          px-3 py-1
          text-xs font-semibold
          rounded-full
          border
          whitespace-nowrap
          ${style}
        `}
      >
        {role}
      </span>
    );
  },
},

    // =========================
    // STATUS
    // =========================
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
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center' as AlignType,
      width: 150,
      className: 'cursor-pointer',
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

    // =========================
    // ACTIONS
    // =========================
    {
      title: t('table:table-item-actions'),
      dataIndex: 'id',
      key: 'actions',
      align: alignRight as AlignType,
      width: 140,
      render: function Render(id: string, record: any) {
        const { data } = useMeQuery();
        const { is_active } = record;

        if (data?.id === id) return null;

        return (
          <ActionButtons
            id={id}
            userStatus={true}
            isUserActive={is_active}
            showAddWalletPoints={true}
            showMakeAdminButton={true}
          />
        );
      },
    },
  ];

  return (
    <>
      {/* =========================
          B-SPACE STYLE TABLE WRAPPER
      ========================== */}
      <div className="b-space-table-wrapper mb-6 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg">
        <Table
          className="b-space-table"
          columns={columns}
          data={admins as any}
          rowKey="id"
          scroll={{ x: 1000 }}
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
        />
      </div>

      {/* =========================
          PAGINATION BAR — PREMIUM
      ========================== */}
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

export default AdminsList;
