import { ActionTypes } from './actions';
import { NoticeInit, Notices, ServiceStatus, ApplicationInit, SubscriberInit, SubscriberState } from './models';

export const noticeReducer = (state: Notices = NoticeInit, action: ActionTypes): Notices => {
  switch (action.type) {
    case 'status/notices/fetch/success': {
      const notices = action.payload;
      const allApplicationsNotices = notices
        .filter((notice) => { return notice.isAllApplications === true });
      return {
        ...state,
        notices: notices,
        allApplicationsNotices
      };
    }

    default:
      return state;
  }
}

export const applicationReducer = (state: ServiceStatus = ApplicationInit, action: ActionTypes): ServiceStatus => {
  switch (action.type) {
    case 'status/applications/fetch/success': {
      const applications = action.payload.filter((app) => { return app.status !== null })
      return {
        ...state,
        applications: applications,
      };
    }

    default:
      return state;
  }
}

export const subscriptionReducer = (state: SubscriberState = SubscriberInit, action: ActionTypes): SubscriberState => {
  switch (action.type) {
    case 'status/subscribe/to/tenant/success': {
      return {
        ...state,
        subscriber: action.payload,
      };
    }

    default:
      return state;
  }
}
