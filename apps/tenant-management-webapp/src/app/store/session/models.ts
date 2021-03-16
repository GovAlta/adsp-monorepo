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
  },
  credentials?: Credentials
}

export interface Credentials {
  token: string;
  tokenExp: number;
  refreshToken: string;
  refreshTokenExp: number;
}

export const SESSION_INIT: Session = {};
