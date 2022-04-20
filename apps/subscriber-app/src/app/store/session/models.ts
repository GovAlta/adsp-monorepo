export interface Session {
  authenticated?: boolean;
  clientId?: string;
  realm?: string;
  userInfo?: {
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

export interface Indicator {
  show: boolean;
  message?: string;
  action?: string;
}

export const SESSION_INIT: Session = {};
