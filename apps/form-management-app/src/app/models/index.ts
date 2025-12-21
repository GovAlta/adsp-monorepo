export interface UserInfo {
  authenticated: boolean;
  userName?: string;
  userEmail?: string;
  displayName: string;
}

export interface Tenant {
  id: string;
  name: string;
  realm: string;
}
