import { Moment } from 'moment';

export interface ValueMetricFields {
  interval: string;
  sum: string;
  avg: string;
  min: string;
  max: string;
  count: string;
}

export interface ValueMetric {
  name: string;
  values: ValueMetricFields[];
}

export interface MetricValue {
  interval: Moment;
  value: number;
}

export type ChartInterval = '15 mins' | '1 hour' | '5 hours';

export interface ServiceMetricsState {
  dashboard: {
    id: string;
    name: string;
    value: number;
  }[];
  services: string[];
  criteria: {
    service: string;
    chartInterval: ChartInterval;
  };
  intervalMin: Date;
  intervalMax: Date;
  isLoading: boolean;
  responseTimes: MetricValue[];
  responseTimeComponents: Record<string, MetricValue[]>;
  counts: MetricValue[];
}
