export interface User {
  id: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  email: string;
  requiredActions: string[];
  access: {
    [key: string]: boolean;
  };
}

export interface Role {
  id: string;
  clientRole: boolean;
  description: string;
  name: string;
  userIds: string[];
}

export interface AccessState {
  metrics: {
    users: number;
    activeUsers: number;
  };
  users: Record<string, User>;
  roles: Record<string, Role>;
}

export const ACCESS_INIT: AccessState = {
  metrics: {
    users: 0,
    activeUsers: 0,
  },
  users: {},
  roles: {},
};
