export interface User {
  jwt: {
    exp: number;
    token: string;
  };
  authenticated: boolean;
  roles: string[];
  username: string;
  keycloak: string;
}

export const USER_INIT: User = {
  jwt: {
    exp: 0,
    token: null,
  },
  authenticated: false,
  roles: [],
  username: 'Guest',
  keycloak: null,
};
