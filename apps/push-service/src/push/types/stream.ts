import { Map } from './map';

export interface StreamEvent {
  namespace: string;
  name: string;
  map?: Map;
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

export interface EventCriteria {
  correlationId?: string;
  context?: Record<string, boolean | number | string>;
}
