import { NotificationType } from './models';

export const FETCH_CONTACT_INFO = 'tenant/notification-service/notificationType/fetch';
export const FETCH_CONTACT_INFO_SUCCEEDED = 'notification-service/space/notificationType/succeeded';

// =============
// Actions Types
// =============

export type ActionTypes = FetchContactInfoSucceededAction | FetchContactInfoAction;

interface FetchContactInfoSucceededAction {
  type: typeof FETCH_CONTACT_INFO_SUCCEEDED;
  payload: {
    notificationInfo: { data: NotificationType };
  };
}

export interface FetchContactInfoAction {
  type: typeof FETCH_CONTACT_INFO;
  payload: {
    tenant: { realm?: string; tenantId?: string };
  };
}

// ==============
// Action Methods
// ==============

export const FetchContactInfoSucceededService = (notificationInfo: {
  data: NotificationType;
}): FetchContactInfoSucceededAction => ({
  type: FETCH_CONTACT_INFO_SUCCEEDED,
  payload: {
    notificationInfo,
  },
});

export const FetchContactInfoService = (tenant: { realm?: string; tenantId?: string }): FetchContactInfoAction => ({
  type: FETCH_CONTACT_INFO,
  payload: {
    tenant,
  },
});
