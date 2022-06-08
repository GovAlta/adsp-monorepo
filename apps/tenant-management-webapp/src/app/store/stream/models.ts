import { Socket } from 'socket.io-client';

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
  description: string;
}

export const initialStream: Stream = {
  id: '',
  name: '',
  events: [],
  description: '',
  publicSubscribe: false,
  subscriberRoles: [],
};
export interface StreamStatus {
  core: Streams;
  tenant: Streams;
  socket: Socket;
  streamData: Record<string, any>[];
}

export type Streams = Record<string, Stream>;

export const InitialStreams: StreamStatus = {
  core: {},
  tenant: {},
  socket: undefined,
  streamData: [],
};

export interface SubscriberRolesOptions {
  value: string;
  label: string;
  key: string;
  dataTestId: string;
}
