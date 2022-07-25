export interface Indicator {
  show: boolean;
  message?: string;
  details?: Record<string, ActionState>;
}

export type ActionState = 'start' | 'in_progress' | 'completed' | 'error';

export interface ElementIndicator {
  show: boolean;
}
export interface Session {
  authenticated?: boolean;
  clientId?: string;
  realm?: string;
  userInfo?: {
    sub?: string;
    name?: string;
    preferredUsername?: string;
    email?: string;
    emailVerified?: boolean;
  };
  realmAccess?: {
    roles?: string[];
  };
  resourceAccess?: Record<string, { roles: string[] }>;
  credentials?: Credentials;
  indicator?: Indicator;
  elementIndicator?: ElementIndicator;
  loadingStates?: LoadingStates;
  isExpired?: boolean;
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
};
