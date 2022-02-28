import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { FetchNotificationMetrics, FetchNotificationSlackInstallation } from '@store/notification/actions';
import { NotificationMetrics } from './metrics';
import { ContactInformation } from './contactInformation';
import { SlackInstall } from './slackInstall';

interface ParentCompProps {
  setActiveEdit?: (boolean) => void;
  disabled?: boolean;
}

export const NotificationsOverview: FunctionComponent<ParentCompProps> = (props) => {
  const { setActiveEdit, disabled } = props;

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchNotificationMetrics());
    dispatch(FetchNotificationSlackInstallation());
  }, []);

  return (
    <div>
      <section>
        <p>
          Notification service provides the ability to generate and send notifications based on domain events sent via
          the event service. This service also includes concepts of subscriptions and subscribers to support management
          of subscriptions.
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
      <ContactInformation />
      <SlackInstall />
      <NotificationMetrics />
    </div>
  );
};
