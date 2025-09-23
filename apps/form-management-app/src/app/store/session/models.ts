export interface Indicator {
  show?: boolean;
  message?: string;
  details?: Record<string, ActionState>;
}

export enum ActionState {
  start,
  inProcess,
  completed,
  error,
}

export interface ModalState {
  id: string;
  type: string;
  isOpen: boolean;
}

export interface ElementIndicator {
  show: boolean;
  id?: string;
}

export interface UserInfo {
  name?: string;
  preferredUsername?: string;
  email?: string;
  emailVerified?: boolean;
  sub?: string;
}
export interface Session {
  authenticated?: boolean;
  clientId?: string;
  realm?: string;
  userInfo?: UserInfo;
  realmAccess?: {
    roles?: string[];
  };
  resourceAccess?: Record<string, { roles: string[] }>;
  credentials?: Credentials;
  indicator?: Indicator;
  elementIndicator?: ElementIndicator;
  loadingStates?: LoadingStates;
  isExpired?: boolean;
  isWillExpired?: boolean;
  modal?: Record<string, ModalState>;
}

export interface Credentials {
  token: string;
  tokenExp: number;
  refreshToken?: string;
  refreshTokenExp?: number;
}

export type LoadingStateType = 'start' | 'completed' | 'error';

export interface LoadingState {
  name: string;
  state?: LoadingStateType;
  id?: string;
  data?: Record<string, string>;
}

export type LoadingStates = Array<LoadingState>;

export const SESSION_INIT: Session = {
  indicator: {
    show: false,
    message: '',
    details: {},
  },
  loadingStates: [],
  isExpired: null,
  modal: {},
};
