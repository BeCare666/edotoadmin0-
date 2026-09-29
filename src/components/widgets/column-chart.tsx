import Chart from '@/components/ui/chart';
import cn from 'classnames';
import { ArrowUp } from '@/components/icons/arrow-up';
import { ArrowDown } from '@/components/icons/arrow-down';

const BarChart = ({
  widgetTitle,
  series,
  colors,
  prefix,
  totalValue,
  text,
  position,
  percentage,
  categories,
}: any) => {
  const options = {
    options: {
      chart: {
        height: 600,
        type: 'line',
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '60%',
          endingShape: 'flat',
        },
      },
      stroke: {
        curve: 'smooth',
        width: [0, 3],
      },
      fill: {
        type: 'solid',
        opacity: [1, 0],
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: [0, 0],
      },
      colors: colors,
      grid: {
        borderColor: '#F1ECE4',
        strokeDashArray: 4,
      },
      xaxis: {
        labels: {
          show: true,
          style: {
            colors: '#9A8E80',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        categories: categories,
      },
      yaxis: {
        show: true,
        labels: {
          show: true,
          style: {
            colors: '#9A8E80',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          },
        },
      },
      tooltip: {
        custom: function ({
          series,
          seriesIndex,
          dataPointIndex,
          w,
        }: {
          dataPointIndex: number;
          seriesIndex: number;
          series: string[];
          w: any;
        }) {
          return (
            '<div class="arrow_box flex flex-col text-center">' +
            '<span class="border-b border-b-slate-200 p-1">' +
            w?.globals?.labels[dataPointIndex] +
            '</span>' +
            '<span class="p-1">' +
            series[seriesIndex][dataPointIndex] +
            '</span>' +
            '</div>'
          );
        },
      },
    },
    series: [
      {
        type: 'column',
        data: series,
      },
    ],
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-3xl border border-[#EDE6DC] bg-white/90 p-6 shadow-[0_1px_2px_rgba(60,40,20,0.04),0_12px_32px_-18px_rgba(60,40,20,0.18)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="edoto-serif text-lg text-[#1F1B16]">
          {widgetTitle}
        </h3>

        <div className="flex flex-col">
          <span className="text-lg font-semibold text-[#3F6B45]">
            {prefix}
            {totalValue}
          </span>

          <div className="flex items-center">
            {position === 'up' && (
              <span className="text-green-500">
                <ArrowUp />
              </span>
            )}
            {position === 'down' && (
              <span className="text-red-400">
                <ArrowDown />
              </span>
            )}
            <span className="text-sm text-heading ms-1">
              <span
                className={cn(
                  position === 'down' ? 'text-red-400' : 'text-green-500'
                )}
              >
                {percentage}
              </span>
              &nbsp;
              {text}
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap" style={{ display: 'block' }}>
        <Chart
          options={options.options}
          series={options.series}
          height="350"
          width="100%"
          type="bar"
        />
      </div>
    </div>
  );
};

export default BarChart;
