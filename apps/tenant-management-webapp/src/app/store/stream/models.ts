export interface Event {
  namespace: string;
  name: string;
}

export interface Stream {
  id: string;
  name: string;
  events: Event[];
  publicSubscribe: boolean;
  subscriberRoles: string[];
}

export interface StreamStatus {
  core: Streams;
  tenant: Streams;
}

export type Streams = Record<string, Stream>;

export const InitialStreams: StreamStatus = {
  core: {},
  tenant: {},
};
