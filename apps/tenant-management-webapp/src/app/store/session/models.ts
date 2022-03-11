export interface Indicator {
  show: boolean;
  message?: string;
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
}

export interface Credentials {
  token: string;
  tokenExp: number;
  refreshToken?: string;
  refreshTokenExp?: number;
}

export const SESSION_INIT: Session = {
  indicator: {
    show: false,
    message: '',
  },
};
