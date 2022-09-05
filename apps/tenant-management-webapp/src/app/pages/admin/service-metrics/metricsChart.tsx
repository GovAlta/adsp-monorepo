import { RootState } from '@store/index';
import {
  Chart as ChartJS,
  Filler,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-moment';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import React, { FunctionComponent } from 'react';
import { Chart } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

ChartJS.register(ChartDataLabels, Filler, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip);

const responseTimeDataSelector = createSelector(
  (state: RootState) => state.serviceMetrics.responseTimes,
  (state: RootState) => state.serviceMetrics.counts,
  (responseTimes, counts) => ({
    // labels: responseTimes.map((rt) => rt.interval),
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

const responseTimeComponentsDataSelector = createSelector(
  (state: RootState) => state.serviceMetrics.responseTimes,
  (state: RootState) => state.serviceMetrics.responseTimeComponents,
  (responseTimes, components) => {
    return {
      datasets: [
        ...Object.entries(components).map(([component, componentTimes]) => ({
          label: component,
          borderColor: 'rgba(40, 123, 231, 1)',
          backgroundColor: 'rgba(40, 123, 231, 0.2)',
          data: componentTimes.map((rt) => ({ x: rt.interval, y: rt.value })),
          yAxisID: 'y',
          pointStyle: 'circle',
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: true,
          stack: 'components',
        })),
        {
          label: 'Response time (ms)',
          borderColor: 'blue',
          backgroundColor: 'rgba(40, 123, 231, 0.2)',
          data: responseTimes.map((rt) => ({ x: rt.interval, y: rt.value })),
          yAxisID: 'y',
          pointStyle: 'circle',
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: true,
        },
      ].sort(
        // Sort by the sum of the values so we generally get the larger values first;
        // this doesn't really work with sparse samples for certain response time components.
        (x, y) =>
          x.data.reduce((sum, { y }) => (y ? sum + y : sum), 0) - y.data.reduce((sum, { y }) => (y ? sum + y : sum), 0)
      ),
    };
  }
);

export const MetricsChart: FunctionComponent = () => {
  const [intervalMax, intervalMin] = useSelector((state: RootState) => [
    state.serviceMetrics.intervalMax,
    state.serviceMetrics.intervalMin,
  ]);
  const requestsAndTimesData = useSelector(responseTimeDataSelector);
  const timeComponentsData = useSelector(responseTimeComponentsDataSelector);

  return (
    <div>
      <h3>Response time and request count</h3>
      <Chart
        type="line"
        data={requestsAndTimesData}
        options={{
          animation: false,
          spanGaps: false,
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
      <h3>Response time breakdown</h3>
      <Chart
        type="line"
        data={timeComponentsData}
        options={{
          animation: false,
          spanGaps: false,
          plugins: {
            datalabels: {
              formatter: function ({ y }: { y?: number } = {}) {
                return y?.toFixed(0) + 'ms';
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
              stacked: true,
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
