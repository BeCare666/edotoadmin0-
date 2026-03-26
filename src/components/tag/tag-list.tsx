import Pagination from '@/components/ui/pagination';
import { Table } from '@/components/ui/table';
import { useTranslation } from 'next-i18next';
import { useIsRTL } from '@/utils/locals';
import { SortOrder } from '@/types';
import { useState } from 'react';
import TitleWithSort from '@/components/ui/title-with-sort';
import { MappedPaginatorInfo, Tag } from '@/types';
import LanguageSwitcher from '@/components/ui/lang-action/action';
import { Routes } from '@/config/routes';
import { NoDataFound } from '@/components/icons/no-data-found';

export type IProps = {
  tags: Tag[] | undefined | null;
  onPagination: (page: number) => void;
  onSort: (sortDirection: SortOrder) => void;
  onOrder: (column: string) => void;
  paginatorInfo: MappedPaginatorInfo | null;
};

const TagList = ({ tags, onPagination, onSort, onOrder, paginatorInfo }: IProps) => {
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();
  //console.log("TAGS =", tags);
  const [sortingObj, setSortingObj] = useState<{
    sort: SortOrder;
    column: string | null;
  }>({
    sort: SortOrder.Desc,
    column: null,
  });

  // Handle column header click
  const onHeaderClick = (column: string | null) => ({
    onClick: () => {
      const newSort =
        sortingObj.sort === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc;

      onSort(newSort);
      if (column) onOrder(column);

      setSortingObj({ sort: newSort, column });
    },
  });

  const columns = [
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-id')}
          ascending={sortingObj.sort === SortOrder.Asc && sortingObj.column === 'id'}
          isActive={sortingObj.column === 'id'}
        />
      ),
      className: 'cursor-pointer',
      dataIndex: 'id',
      key: 'id',
      align: alignLeft,
      width: 180,
      onHeaderCell: () => onHeaderClick('id'),
      render: (id: number) => `#${t('table:table-item-id')}: ${id}`,
    },
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-title')}
          ascending={sortingObj.sort === SortOrder.Asc && sortingObj.column === 'name'}
          isActive={sortingObj.column === 'name'}
        />
      ),
      className: 'cursor-pointer',
      dataIndex: 'name',
      key: 'name',
      align: alignLeft,
      width: 220,
      onHeaderCell: () => onHeaderClick('name'),
    },
    {
      title: t('table:table-item-slug'),
      dataIndex: 'slug',
      key: 'slug',
      align: 'center',
      width: 250,
      ellipsis: true,
    },

    {
      title: t('table:table-item-actions'),
      dataIndex: 'slug',
      key: 'actions',
      align: alignRight,
      width: 120,
      render: (slug: string, record: Tag) => (
        <LanguageSwitcher
          slug={slug}
          record={record}
          deleteModalView="DELETE_TAG"
          routes={Routes?.tag}
        />
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 overflow-hidden rounded shadow">
        <Table
          //@ts-ignore
          columns={columns}
          emptyText={() => (
            <div className="flex flex-col items-center py-7">
              <NoDataFound className="w-52" />
              <div className="mb-1 pt-6 text-base font-semibold text-heading">
                {t('table:empty-table-data')}
              </div>
              <p className="text-[13px]">{t('table:empty-table-sorry-text')}</p>
            </div>
          )}
          //@ts-ignore
          data={tags}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </div>

      {!!paginatorInfo?.total && (
        <div className="flex items-center justify-end">
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

export default TagList;


