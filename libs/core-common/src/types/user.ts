export type UserRole = string;

export interface User<R extends UserRole = UserRole> {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  tenantName?: string;
  client?: string;
}
