export type MetricInterval = 'hourly' | 'daily' | 'weekly';

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
}

export interface MetricCriteria {
  interval: MetricInterval;
  intervalMin?: Date;
  intervalMax?: Date;
}

export interface Metric {
  name: string;
  values: MetricIntervalValue[];
}
