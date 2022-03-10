import { ActionTypes, FETCH_CONTACT_INFO_SUCCEEDED } from './actions';
import { NOTIFICATION_INIT, NotificationState } from './models';

export default function (state = NOTIFICATION_INIT, action: ActionTypes): NotificationState {
  switch (action.type) {
    case FETCH_CONTACT_INFO_SUCCEEDED: {
      const contactInfo = action.payload.notificationInfo.data;

      return {
        ...state,
        contactInfo: contactInfo,
      };
    }
    default:
      return state;
  }
}
