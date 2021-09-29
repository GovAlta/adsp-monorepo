import { ActionTypes } from './actions';
import { NoticeInit, Notices, ServiceStatus, ApplicationInit } from './models';

export const noticeReducer = (state: Notices = NoticeInit, action: ActionTypes): Notices => {
  switch (action.type) {
    case 'status/notices/fetch/success':
      return {
        ...state,
        notices: action.payload,
      };

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