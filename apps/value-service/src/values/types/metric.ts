export type MetricInterval = 'one_minute' | 'five_minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly';

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

// clean-code-ignore: RULE-19 — type declarations only, no logic; usage is covered in timescale/value.spec.ts.
export interface PlatformMetricIntervalValue extends MetricIntervalValue {
  tenantId: string;
}

export interface PlatformMetric {
  name: string;
  values: PlatformMetricIntervalValue[];
}
