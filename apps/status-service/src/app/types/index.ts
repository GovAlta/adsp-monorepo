export type NoticeModeType = 'active' | 'draft' | 'published' | 'archived';
export function isValidNoticeModeType(mode: NoticeModeType): boolean {
  switch (mode) {
    case 'draft':
    case 'published':
    case 'archived':
      return true;
    default:
      return false;
  }
}

export interface NoticeApplication {
  id: string;
  message: string;
  isAllApplications: boolean;
  tennantServRef: string;
  startDate: Date;
  endDate: Date;
  mode: NoticeModeType;
  created: Date;
  tenantId: string;
  tenantName: string;
}
export * from './serviceStatus';
export * from './endpointStatusEntry';
export * from './roles';
