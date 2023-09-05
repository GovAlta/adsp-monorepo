import { Socket } from 'socket.io-client';

export const EditModalType = 'stream-edit-modal';
export const AddModalType = 'stream-add-modal';

export interface Event {
  namespace: string;
  name: string;
}

export interface Stream {
  id: string;
  name: string;
  events: Event[];
  publicSubscribe: boolean;
  subscriberRoles?: string[];
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
  //eslint-disable-next-line
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
  dataTestId: string;
}

export const InitStream = {
  id: '',
  name: '',
  events: [],
  publicSubscribe: false,
  subscriberRoles: [],
  description: '',
};
