import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

interface TooltipContext {
  parsed: { y: number };
  datasetIndex: number;
  dataIndex: number;
  label: string;
}

interface BarChartProps {
  data: ChartData;
  title?: string;
  height?: number;
  tooltipFormatter?: (value: number, context: TooltipContext) => string;
  onClick?: (event: any, elements: any[]) => void;
  options?: any;
}

interface PieChartProps {
  data: ChartData;
  title?: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, height = 300, tooltipFormatter, onClick, options: additionalOptions }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    ...additionalOptions,
    onClick: (event: any, elements: any[]) => {
      if (onClick) {
        onClick(event, elements);
      }
    },
    plugins: {
      ...additionalOptions?.plugins,
      legend: {
        position: 'top' as const,
        ...additionalOptions?.plugins?.legend,
      },
      title: {
        display: !!title || !!additionalOptions?.plugins?.title?.display,
        text: title || additionalOptions?.plugins?.title?.text,
        ...additionalOptions?.plugins?.title,
      },
      tooltip: tooltipFormatter
        ? {
          callbacks: {
            label: function (context: TooltipContext) {
              const value = context.parsed.y;
              return tooltipFormatter(value, context);
            }
          }
        }
        : (additionalOptions?.plugins?.tooltip || {}),
    }
  };

  return (
    <div style={{ height }}>
      <Bar options={options} data={data} />
    </div>
  );
};

export const PieChart: React.FC<PieChartProps> = ({ data, title, height = 300 }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
  };

  return (
    <div style={{ height }}>
      <Pie options={options} data={data} />
    </div>
  );
};
