import { ActionTypes, GET_MY_SUBSCRIBER_DETAILS_SUCCESS } from './actions';
import { SUBSCRIBER_INIT, SubscriberService } from './models';

export default function (state = SUBSCRIBER_INIT, action: ActionTypes): SubscriberService {
  switch (action.type) {
    case GET_MY_SUBSCRIBER_DETAILS_SUCCESS:
      return {
        ...state,
        subscriber: action.payload.subscriber,
      };
    default:
      return state;
  }
}
