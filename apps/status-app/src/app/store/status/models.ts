export type InternalServiceStatusType = 'stopped' | 'healthy' | 'unhealthy' | 'pending';
export type PublicServiceStatusType = 'operational' | 'maintenance' | 'outage' | 'reported-issues';
export type ServiceStatusType = InternalServiceStatusType | PublicServiceStatusType;
export const PublicServiceStatusTypes = ['operational', 'maintenance', 'outage', 'reported-issues'];
export type EndpointStatusType = 'offline' | 'online' | 'pending';
export type ModeType = 'draft' | 'active';

export interface ServiceStatus {
  applications: ServiceStatusApplication[];
}

export interface ServiceStatusApplication {
  _id?: string;
  tenantId: string;
  name: string;
  description: string;
  metadata?: unknown;
  enabled: boolean;
  statusTimestamp?: number;
  status?: ServiceStatusType;
  internalStatus?: InternalServiceStatusType;
  endpoint?: ServiceStatusEndpoint;
  notices?: Notice[];
}

export interface ServiceStatusEndpoint {
  url: string;
  status: EndpointStatusType;
  statusEntries?: EndpointStatusEntry[];
}

export interface ServiceStatusNotifications {
  applicationId: string;
  type: string;
  data: unknown;
  level: 'severe' | '???';
}

export interface ServiceStatusLog {
  applicationId: string;
  timestamp: number;
  status: InternalServiceStatusType | PublicServiceStatusType;
}

export interface EndpointStatusEntry {
  ok: boolean;
  url: string;
  timestamp: number;
  responseTime: number;
  status: number | string;
}

export interface NoticeApplicationRef {
  id?: string;
  name?: string;
}

export interface Notice {
  id?: string;
  message: string;
  tennantServRef: NoticeApplicationRef[];
  startDate: string;
  endDate: string;
  mode?: ModeType;
  isCrossTenants?: boolean;
}

export interface Notices {
  notices: Notice[]
}

export const NoticeInit: Notices = {
  notices: []
}

export const ApplicationInit: ServiceStatus = {
  applications: []
}

// Helper functions
export const parseNotices = (notices: Notice[]): Notice[] => {
  for (const notice of notices) {
    if (typeof notice.tennantServRef === 'string') {
      notice.tennantServRef = JSON.parse(notice.tennantServRef)
    }
  }
  return notices;
}

export const bindApplicationsWithNotices = (
  applicationsRaw: ServiceStatusApplication[],
  notices: Notice[]): ServiceStatusApplication[] => {
  // Q: Is undefined status allowed?
  const applications = applicationsRaw.filter((application) => { return application.status !== undefined })
  for (const application of applications) {
    const noticesOfApplication = notices.filter((notice) => {
      return notice.tennantServRef.find(
        (applicationRef) => applicationRef.id === application._id)
    })

    application.notices = sortNotices(noticesOfApplication)
  }

  return sortApplications(applications);
}

const compareDate = (prev: string, next: string): number => {
  return new Date(prev).getTime() < new Date(next).getTime() ? -1 : 1;
}

export const sortNotices = (notices: Notice[]): Notice[] => {
  if (!notices || notices.length <= 1) {
    return notices
  }

  return notices.sort((prev, next) => {
    return compareDate(prev.startDate, next.startDate);
  });
}

export const sortApplications = (applications: ServiceStatusApplication[]): ServiceStatusApplication[] => {
  return applications.sort((pre, next) => {
    return pre.name < next.name ? -1 : 1
  })
}