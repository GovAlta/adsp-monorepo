export type MetricInterval = 'one_minute' | 'five_minutes' | 'hourly' | 'daily' | 'weekly';

export interface MetricValue {
  namespace: string;
  name: string;
  metric: string;
  timestamp: Date;
  value: number;
}

export interface MetricIntervalValue {
  interval: Date;
  avg: number;
  sum: number;
  max: number;
  min: number;
  count: number;
}

export interface MetricCriteria {
  interval: MetricInterval;
  intervalMin?: Date;
  intervalMax?: Date;
  metricLike?: string;
}

export interface Metric {
  name: string;
  values: MetricIntervalValue[];
}
