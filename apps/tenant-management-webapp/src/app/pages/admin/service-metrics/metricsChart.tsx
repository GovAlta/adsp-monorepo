import { RootState } from '@store/index';
import {
  Chart as ChartJS,
  Filler,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  TimeScale,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-moment';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import React, { FunctionComponent } from 'react';
import { Chart } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

ChartJS.register(
  ChartDataLabels,
  Filler,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip
);

const responseTimeDataSelector = createSelector(
  (state: RootState) => state.serviceMetrics.responseTimes,
  (state: RootState) => state.serviceMetrics.counts,
  (state: RootState) => state.serviceMetrics.intervalMin,
  (state: RootState) => state.serviceMetrics.intervalMax,
  (responseTimes, counts, intervalMin, intervalMax) => ({
    // labels: responseTimes.map((rt) => rt.interval),
    intervalMin,
    intervalMax,
    datasets: [
      {
        label: 'Response time (ms)',
        borderColor: 'blue',
        backgroundColor: 'blue',
        data: responseTimes.map((rt) => ({ x: rt.interval, y: rt.value })),
        yAxisID: 'y',
        pointStyle: 'circle',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Requests (#)',
        borderColor: 'red',
        backgroundColor: 'red',
        data: counts.map((count) => ({ x: count.interval, y: count.value })),
        yAxisID: 'count',
        pointStyle: 'circle',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  })
);

export const MetricsChart: FunctionComponent = () => {
  const { intervalMin, intervalMax, ...data } = useSelector(responseTimeDataSelector);
  return (
    <div>
      <Chart
        type="line"
        data={data}
        options={{
          plugins: {
            datalabels: {
              formatter: function ({ y }: { y?: number } = {}, context) {
                return y?.toFixed(0) + (context.datasetIndex === 0 ? ' ms' : ' requests');
              },
              align: function ({ dataIndex, dataset }) {
                const index = dataIndex;
                return dataset.data[index + 1]?.['y'] > dataset.data[index]?.['y'] ? 45 : -45;
              },
            },
          },
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              display: true,
              type: 'linear',
              title: {
                display: true,
                text: 'Average response time (ms)',
              },
              ticks: {
                padding: 12,
              },
              suggestedMin: 0,
              suggestedMax: 200,
            },
            count: {
              display: true,
              type: 'linear',
              position: 'right',
              title: {
                display: true,
                text: 'Requests (#)',
              },
              grid: {
                drawOnChartArea: false,
              },
              suggestedMin: 0,
              suggestedMax: 10,
            },
            x: {
              type: 'time',
              time: {
                unit: 'minute',
                stepSize: 5,
              },
              ticks: {
                padding: 12,
              },
              suggestedMin: intervalMin?.toISOString(),
              suggestedMax: intervalMax?.toISOString(),
            },
          },
        }}
      />
    </div>
  );
};
