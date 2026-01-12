import { GoabNotification } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { feedbackSelector, feedbackActions, FeedbackMessageLevel } from '../state';
import { GoabNotificationType } from '@abgov/ui-components-common';
const notificationTypes: Record<FeedbackMessageLevel, GoabNotificationType> = {
  success: 'event',
  info: 'information',
  warn: 'important',
  error: 'emergency',
};

export const FeedbackNotification = () => {
  const dispatch = useDispatch();
  const item = useSelector(feedbackSelector);

  return (
    item && (
      <GoabNotification
        key={item.id}
        type={notificationTypes[item.level]}
        onDismiss={() => dispatch(feedbackActions.dismissItem())}
      >
        {item.message}
      </GoabNotification>
    )
  );
};
