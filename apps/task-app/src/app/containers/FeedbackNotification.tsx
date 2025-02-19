import { GoANotification, NotificationType } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { feedbackSelector, feedbackActions, FeedbackMessageLevel } from '../state';

const notificationTypes: Record<FeedbackMessageLevel, NotificationType> = {
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
      <GoANotification
        key={item.id}
        type={notificationTypes[item.level]}
        onDismiss={() => dispatch(feedbackActions.dismissItem())}
      >
        {item.message}
      </GoANotification>
    )
  );
};
