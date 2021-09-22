export interface Session {
  isLoadingReady?: boolean;
  notifications: Notification[]
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
  notifications: []
}