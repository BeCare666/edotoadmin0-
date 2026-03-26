'use client';

import Label from '@/components/ui/label';
import Select from '@/components/ui/select/select';
import { useTranslation } from 'next-i18next';
import { SortOrder } from '@/types';
import cn from 'classnames';
import { useMemo } from 'react';

const STATUS_OPTIONS = [
  { value: '', labelKey: 'common:filter-status-all' },
  { value: 'true', labelKey: 'common:text-active' },
  { value: 'false', labelKey: 'common:text-inactive' },
];

const SORT_OPTIONS = [
  { value: 'name', labelKey: 'table:table-item-shop' },
  { value: 'created_at', labelKey: 'common:filter-sort-created' },
  { value: 'products_count', labelKey: 'table:table-item-total-products' },
  { value: 'orders_count', labelKey: 'table:table-item-total-orders' },
  { value: 'is_active', labelKey: 'table:table-item-status' },
];

const ORDER_OPTIONS = [
  { value: SortOrder.Desc, labelKey: 'common:filter-order-desc' },
  { value: SortOrder.Asc, labelKey: 'common:filter-order-asc' },
];

const PER_PAGE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
];

export type ShopsFilterValues = {
  isActive?: boolean | null;
  orderBy: string;
  sortedBy: SortOrder;
  limit: number;
};

type Props = {
  values: ShopsFilterValues;
  onChange: (values: ShopsFilterValues) => void;
  onReset: () => void;
  className?: string;
};

export default function ShopsAdvancedFilter({
  values,
  onChange,
  onReset,
  className,
}: Props) {
  const { t } = useTranslation();

  const statusValue =
    values.isActive === undefined || values.isActive === null
      ? ''
      : values.isActive
        ? 'true'
        : 'false';

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((o) => ({
        value: o.value,
        label: t(o.labelKey),
      })),
    [t]
  );
  const sortOptions = useMemo(
    () =>
      SORT_OPTIONS.map((o) => ({
        value: o.value,
        label: t(o.labelKey),
      })),
    [t]
  );
  const orderOptions = useMemo(
    () =>
      ORDER_OPTIONS.map((o) => ({
        value: o.value,
        label: t(o.labelKey),
      })),
    [t]
  );
  const perPageOptions = useMemo(
    () =>
      PER_PAGE_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
      })),
    []
  );

  const selectedStatus = statusOptions.find((o) => o.value === statusValue) ?? null;
  const selectedSort = sortOptions.find((o) => o.value === values.orderBy) ?? sortOptions[0];
  const selectedOrder = orderOptions.find((o) => o.value === values.sortedBy) ?? orderOptions[0];
  const selectedPerPage =
    perPageOptions.find((o) => o.value === values.limit) ?? perPageOptions[0];

  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-md md:p-6',
        className
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 md:border-0 md:pb-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
              />
            </svg>
          </span>
          <h3 className="text-base font-semibold text-slate-800">
            {t('common:filter-advanced')}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {/* Statut */}
          <div className="flex w-fit min-w-[10rem] flex-col gap-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('table:table-item-status')}
            </Label>
            <Select
              options={statusOptions}
              getOptionLabel={(opt: { label: string }) => opt.label}
              getOptionValue={(opt: { value: string }) => opt.value}
              value={selectedStatus}
              onChange={(opt: { value: string } | null) => {
                const v =
                  opt?.value === ''
                    ? undefined
                    : opt?.value === 'true';
                onChange({ ...values, isActive: v });
              }}
              isClearable={false}
              placeholder={t('common:filter-status-all')}
              className="rounded-lg border-slate-200 py-1.5 text-sm"
            />
          </div>

          {/* Tri par */}
          <div className="flex w-fit min-w-[10rem] flex-col gap-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('common:filter-sort-by')}
            </Label>
            <Select
              options={sortOptions}
              getOptionLabel={(opt: { label: string }) => opt.label}
              getOptionValue={(opt: { value: string }) => opt.value}
              value={selectedSort}
              onChange={(opt: { value: string } | null) => {
                if (opt?.value != null)
                  onChange({ ...values, orderBy: opt.value });
              }}
              isClearable={false}
              className="rounded-lg border-slate-200 py-1.5 text-sm"
            />
          </div>

          {/* Ordre */}
          <div className="flex w-fit min-w-[10rem] flex-col gap-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('common:filter-order')}
            </Label>
            <Select
              options={orderOptions}
              getOptionLabel={(opt: { label: string }) => opt.label}
              getOptionValue={(opt: { value: SortOrder }) => opt.value}
              value={selectedOrder}
              onChange={(opt: { value: SortOrder } | null) => {
                if (opt?.value != null)
                  onChange({ ...values, sortedBy: opt.value });
              }}
              isClearable={false}
              className="rounded-lg border-slate-200 py-1.5 text-sm"
            />
          </div>

          {/* Par page */}
          <div className="flex w-fit min-w-[6rem] flex-col gap-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('common:filter-per-page')}
            </Label>
            <Select
              options={perPageOptions}
              getOptionLabel={(opt: { label: string }) => opt.label}
              getOptionValue={(opt: { value: number }) => String(opt.value)}
              value={selectedPerPage}
              onChange={(opt: { value: number } | null) => {
                if (opt?.value != null) onChange({ ...values, limit: opt.value });
              }}
              isClearable={false}
              className="rounded-lg border-slate-200 py-1.5 text-sm"
            />
          </div>

          {/* Réinitialiser – compact, w-fit pour éviter l’étirement */}
          <div className="flex items-end justify-end">
            <button
              type="button"
              onClick={onReset}
              className="w-fit shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t('common:filter-reset')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
