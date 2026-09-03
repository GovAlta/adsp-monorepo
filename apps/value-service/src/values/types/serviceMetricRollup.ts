export interface ServiceMetricRollup {
  day: Date;
  tenant: string;
  service: string;
  initiated: number | null;
  succeeded: number | null;
  failure_events: number | null;
  unreconciled: number | null;
  duration_sum: number | null;
  duration_count: number | null;
  duration_max: number | null;
  distinct_resources: number | null;
}

export interface MetricRollupSource {
  metric?: string;
  metricLike?: string;
}

export interface EventCountRollupSource {
  namespace: string;
  name: string;
  payloadCountPath?: string[];
}

export interface ResourceRollupSource {
  namespace: string;
  names: string[];
  contextKey: string;
}

export interface ServiceMetricRollupMapping {
  service: string;
  initiated?: MetricRollupSource | EventCountRollupSource;
  succeeded?: MetricRollupSource | EventCountRollupSource;
  failure_events?: MetricRollupSource | EventCountRollupSource;
  duration?: MetricRollupSource;
  resource?: ResourceRollupSource;
}

export interface RollupDateRange {
  start: Date;
  end: Date;
}
