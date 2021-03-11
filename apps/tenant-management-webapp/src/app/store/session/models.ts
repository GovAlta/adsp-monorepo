/* eslint-disable @typescript-eslint/camelcase */
export interface Session {
  authenticated?: boolean;
  clientId?: string;
  realm?: string;
  userInfo?: {
    name?: string;
    preferred_username?: string;
    email?: string;
    email_verified?: boolean;
  };
  tokenParsed?: {
    exp?: number;
  };
  token?: string;
  realmAccess?: {
    roles?: string[];
  }
  refreshTokenParsed?: {
    exp?: number;
  };
  refreshToken?: string;
}

export const SESSION_INIT: Session = {};
