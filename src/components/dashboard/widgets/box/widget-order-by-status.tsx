import StickerCard from '@/components/widgets/sticker-card';
import { useTranslation } from 'react-i18next';
import { TodayTotalOrderByStatus } from '@/types';
import { Fragment } from 'react';
import { OrderProcessedIcon } from '@/components/icons/summary/order-processed';
import { CustomersIcon } from '@/components/icons/summary/customers';
import { ChecklistIcon } from '@/components/icons/summary/checklist';
import { EaringIcon } from '@/components/icons/summary/earning';

interface IProps {
  order: TodayTotalOrderByStatus;
  timeFrame?: number;
  allowedStatus: any;
}

const WidgetOrderByStatus: React.FC<IProps> = ({
  order,
  timeFrame = 1,
  allowedStatus,
}) => {
  const { t } = useTranslation();

  let tempContent = [];
  const widgetContents = [
    {
      key: "pending",
      title: t("text-pending-order"),
      subtitle: `sticker-card-subtitle-last-${timeFrame}-days`,
      icon: (
        <svg className="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      ),
      color: "#FFF",
      data: order?.pending!,
    },
    {
      key: "processing",
      title: t("text-processing-order"),
      subtitle: `sticker-card-subtitle-last-${timeFrame}-days`,
      icon: (
        <svg className="h-8 w-8 text-blue-500 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m6.364 1.636l-2.121 2.121M21 12h-3m-1.636 6.364l-2.121-2.121M12 21v-3m-6.364-1.636l2.121-2.121M3 12h3m1.636-6.364l2.121 2.121" />
        </svg>
      ),
      color: "#FFF",
      data: order?.processing!,
    },
    {
      key: "complete",
      title: t("text-completed-order"),
      subtitle: `sticker-card-subtitle-last-${timeFrame}-days`,
      icon: (
        <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: "#FFF",
      data: order?.complete!,
    },
    {
      key: "cancel",
      title: t("text-cancelled-order"),
      subtitle: `sticker-card-subtitle-last-${timeFrame}-days`,
      icon: (
        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
        </svg>
      ),
      color: "#FFF",
      data: order?.cancelled!,
    },
    {
      key: "refund",
      title: t("text-refunded-order"),
      subtitle: `sticker-card-subtitle-last-${timeFrame}-days`,
      icon: (
        <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M20 4h-6v6M4 20h6v-6" />
        </svg>
      ),
      color: "#FFF",
      data: order?.refunded!,
    },
    {
      key: "fail",
      title: t("text-failed-order"),
      subtitle: `sticker-card-subtitle-last-${timeFrame}-days`,
      icon: (
        <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "#A7F3D0",
      data: order?.failed!,
    },
    {
      key: "local-facility",
      title: t("text-order-local-facility"),
      subtitle: `sticker-card-subtitle-last-${timeFrame}-days`,
      icon: (
        <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
        </svg>
      ),
      color: "#A7F3D0",
      data: order?.localFacility!,
    },
    {
      key: "out-for-delivery",
      title: t("text-order-out-delivery"),
      subtitle: `sticker-card-subtitle-last-${timeFrame}-days`,
      icon: (
        <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l2-2h13l3 3v5h-2a2 2 0 01-2-2v-1H7v1a2 2 0 01-2 2H3v-6z" />
          <circle cx="7.5" cy="18.5" r="1.5" />
          <circle cx="17.5" cy="18.5" r="1.5" />
        </svg>
      ),
      color: "#A7F3D0",
      data: order?.outForDelivery!,
    },
  ];


  for (let index = 0; index < allowedStatus.length; index++) {
    const element = allowedStatus[index];
    const items = widgetContents.find((item) => item.key === element);
    tempContent.push(items);
  }

  return (
    <Fragment>
      <div className="mt-5 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {tempContent && tempContent.length > 0
          ? tempContent.map((content) => {
            return (
              <div className="w-full" key={content?.key}>
                <StickerCard
                  titleTransKey={content?.title}
                  subtitleTransKey={content?.subtitle}
                  icon={content?.icon}
                  color={content?.color}
                  price={content?.data}
                />
              </div>
            );
          })
          : ''}
      </div>
    </Fragment>
  );
};

export default WidgetOrderByStatus;
