import { Map } from './map';

export interface StreamEvent {
  namespace: string;
  name: string;
  map?: Map;
  criteria?: EventCriteria;
}

export interface Stream {
  spaceId: string;
  id: string;
  name: string;
  events: StreamEvent[];
  subscriberRoles: string[];
}

export interface EventCriteria {
  correlationId?: string;
  context?: {
    [key: string]: boolean | number | string;
  };
}
