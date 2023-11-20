export interface EventCriteria {
  correlationId?: string;
  context?: Record<string, boolean | number | string>;
}

export interface StreamEvent {
  namespace: string;
  name: string;
  map?: Record<string, string>;
  criteria?: EventCriteria;
}

export interface Stream {
  id: string;
  name: string;
  description: string;
  events: StreamEvent[];
  subscriberRoles: string[];
  publicSubscribe: boolean;
}
