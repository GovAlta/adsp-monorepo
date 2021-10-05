export type InternalServiceStatusType = 'operational' | 'reported-issues' | 'pending' | 'disabled';
export type PublicServiceStatusType = 'operational' | 'maintenance' | 'outage' | 'pending' | 'disabled';
export type ServiceStatusType = InternalServiceStatusType | PublicServiceStatusType;
export const PublicServiceStatusTypes = ['operational', 'maintenance', 'outage', 'pending', 'disabled'];
export type ModeType = 'draft' | 'active';

export interface Notices {
  notices: Notice[];
}

export interface tennantServRef {
  name: string;
  id: string;
}

export interface Notice {
  id?: string;
  message: string;
  tennantServRef: tennantServRef[];
  startDate: Date;
  endDate: Date;
  mode?: ModeType;
  isAllApplications?: boolean;
}

export interface NoticesResult {
  results: Notice[];
}

export interface NoticeResult {
  results: Notice;
}
