export type UserRole = string;

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  tenantName?: string;
  client?: string;
}
