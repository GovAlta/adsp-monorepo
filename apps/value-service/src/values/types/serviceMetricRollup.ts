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

// Coverage is a single contiguous span of whole days per source, extended from one of its edges like
// the metric interval coverage.
export interface EventResourceCoverage {
  namespace: string;
  contextKey: string;
  coveredFrom: Date;
  coveredTo: Date;
}

export interface EventResourceCriteria {
  tenant: string;
  namespace: string;
  names: string[];
  contextKey: string;
  // Inclusive.
  from: Date;
  // Exclusive.
  to: Date;
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
