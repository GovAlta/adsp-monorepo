export interface Interval {
  metric: string | string[];
  namespace: string;
  name: string;
}

export interface EventDefinition {
  name: string;
  description: string;
  payloadSchema: Record<string, unknown>;
  interval?: Interval;
}
