import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { NotificationMetrics } from './metrics';
import { FetchNotificationMetrics } from '@store/notification/actions';
import { useDispatch } from 'react-redux';

interface ParentCompProps {
  setActiveEdit?: (boolean) => void;
  disabled?: boolean;
}

export const NotificationsOverview: FunctionComponent<ParentCompProps> = (props) => {
  const { setActiveEdit, disabled } = props;

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchNotificationMetrics());
  }, []);

  return (
    <div>
      <section>
        <p>
          Notification service provides the ability to generate and send notifications based on domain events sent via
          the event service. This service also includes a concept of subscriptions and subscribers to support management
          of subscriber preferences and unsubscribe.
        </p>
        <GoAButton
          data-testid="add-notification-overview"
          disabled={disabled}
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add notification type
        </GoAButton>
      </section>

      <NotificationMetrics />
    </div>
  );
};
