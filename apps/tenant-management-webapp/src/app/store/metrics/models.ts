import { Moment } from 'moment';

export interface ValueMetric {
  name: string;
  values: {
    interval: string;
    sum: string;
    avg: string;
    min: string;
    max: string;
    count: string;
  }[];
}

export interface MetricValue {
  interval: Moment;
  value: number;
}

export type ChartInterval = '15 mins' | '1 hour' | '5 hours';

export interface ServiceMetricsState {
  services: string[];
  criteria: {
    service: string;
    chartInterval: ChartInterval;
  };
  intervalMin: Date;
  intervalMax: Date;
  isLoading: boolean;
  responseTimes: MetricValue[];
  counts: MetricValue[];
}
