import Pagination from '@/components/ui/pagination';
import { Table } from '@/components/ui/table';
import { useTranslation } from 'next-i18next';
import { useIsRTL } from '@/utils/locals';
import { useState } from 'react';
import TitleWithSort from '@/components/ui/title-with-sort';
import { NoDataFound } from '@/components/icons/no-data-found';
import Badge from '@/components/ui/badge/badge';
import { SortOrder, MappedPaginatorInfo } from '@/types';

type Campaign = {
  id: number;
  title: string;
  location: string;
  status: 'a_venir' | 'planifie' | 'en_cours';
  objective_kits: number;
  distributed_kits: number;
  date_start: string;
};

type IProps = {
  campaigns: Campaign[] | undefined;
  paginatorInfo: MappedPaginatorInfo | null;
  onPagination: (current: number) => void;
  onSort: (current: any) => void;
  onOrder: (current: string) => void;
};

const CampaignList = ({
  campaigns,
  paginatorInfo,
  onPagination,
  onSort,
  onOrder,
}: IProps) => {
  const { t } = useTranslation();
  const { alignLeft } = useIsRTL();

  const [sortingObj, setSortingObj] = useState({
    sort: SortOrder.Desc,
    column: null,
  });

  const onHeaderClick = (column: any | null) => ({
    onClick: () => {
      onSort((currentSortDirection: SortOrder) =>
        currentSortDirection === SortOrder.Desc
          ? SortOrder.Asc
          : SortOrder.Desc
      );

      onOrder(column);

      setSortingObj({
        sort:
          sortingObj.sort === SortOrder.Desc
            ? SortOrder.Asc
            : SortOrder.Desc,
        column,
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_cours':
        return {
          text: 'Active',
          color: 'bg-emerald-100 text-emerald-700',
        };
      case 'planifie':
        return {
          text: 'Planned',
          color: 'bg-yellow-100 text-yellow-700',
        };
      default:
        return {
          text: 'Upcoming',
          color: 'bg-slate-100 text-slate-700',
        };
    }
  };

  const columns = [
    {
      title: (
        <TitleWithSort
          title="ID"
          ascending={
            sortingObj.sort === SortOrder.Asc &&
            sortingObj.column === 'id'
          }
          isActive={sortingObj.column === 'id'}
        />
      ),
      dataIndex: 'id',
      key: 'id',
      align: alignLeft,
      width: 120,
      onHeaderCell: () => onHeaderClick('id'),
      render: (id: number) => (
        <span className="font-mono text-sm font-semibold text-gray-800">
          #{id}
        </span>
      ),
    },

    {
      title: (
        <TitleWithSort
          title="Campaign"
          ascending={
            sortingObj.sort === SortOrder.Asc &&
            sortingObj.column === 'title'
          }
          isActive={sortingObj.column === 'title'}
        />
      ),
      dataIndex: 'title',
      key: 'title',
      align: alignLeft,
      width: 300,
      onHeaderCell: () => onHeaderClick('title'),
      render: (title: string, record: Campaign) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">
            {title}
          </span>
          <span className="text-xs text-gray-500">
            {record.location}
          </span>
        </div>
      ),
    },

    {
      title: "Progress",
      dataIndex: 'distributed_kits',
      key: 'progress',
      align: 'center',
      render: (_: any, record: Campaign) => (
        <span className="font-medium text-gray-700">
          {record.distributed_kits} / {record.objective_kits}
        </span>
      ),
    },

    {
      title: "Start Date",
      dataIndex: 'date_start',
      key: 'date_start',
      align: 'center',
      render: (date: string) => (
        <span className="text-sm text-gray-600">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },

    {
      title: "Status",
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status: string) => {
        const badge = getStatusBadge(status);
        return <Badge text={badge.text} color={badge.color} />;
      },
    },
  ];

  return (
    <>
      <div className="b-space-table-wrapper mb-6 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg">
        <Table
          //@ts-ignore
          className="b-space-table"
          columns={columns}
          emptyText={() => (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <NoDataFound className="h-40 w-40 text-gray-300" />
              <div className="mt-6 text-base font-semibold text-gray-700">
                No campaigns found
              </div>
            </div>
          )}
          data={campaigns as any}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </div>

      {!!paginatorInfo?.total && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 shadow-md">
          <span className="text-sm font-semibold text-slate-600">
            Total: {paginatorInfo.total}
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

export default CampaignList;