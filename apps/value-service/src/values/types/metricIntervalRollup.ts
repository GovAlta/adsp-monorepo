import { MetricInterval } from './metric';

export interface MetricIntervalWindow {
  start: Date;
  end: Date;
}

// Coverage is a single contiguous span per interval. Refreshes always extend it from one of its
// edges, so a window inside it is known to be rolled up and anything outside it is not.
export interface MetricIntervalCoverage {
  interval: MetricInterval;
  coveredFrom: Date;
  coveredTo: Date;
}

export interface MetricIntervalRollup {
  interval: MetricInterval;
  namespace: string;
  name: string;
  tenant: string | null;
  metric: string;
  bucket: Date;
  sum: number;
  count: number;
  min: number;
  max: number;
}
