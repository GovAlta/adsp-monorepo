export interface Tenant {
  name? : string;
}
export interface Session {
  isLoadingReady?: boolean;
  notifications: Notification[];
  tenant: Tenant
}

export interface Notification {
  name?: string;
  id?: string;
  message: string;
  priority?: number
  type?: 'error' | 'info'
}

export const SessionInit = {
  isLoadingReady: true,
  notifications: [],
  tenant: {
    name: 'platform' // tenant name comes from URL. The main page points to the platform notices
  }
}