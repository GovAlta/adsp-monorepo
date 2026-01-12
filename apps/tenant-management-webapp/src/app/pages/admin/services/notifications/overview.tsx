import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GoabButton } from '@abgov/react-components';
import { FetchNotificationMetrics } from '@store/notification/actions';
import { NotificationMetrics } from './metrics';
import { ContactInformation } from './contactInformation';
import { EmailInformation } from './emailinformation/emailSection';
import { BotNotifications } from './botNotifications';
import { OverviewLayout } from '@components/Overview';

interface ParentCompProps {
  setActiveEdit?: (boolean) => void;
  disabled?: boolean;
}

export const NotificationsOverview: FunctionComponent<ParentCompProps> = (props) => {
  const { setActiveEdit, disabled } = props;

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchNotificationMetrics());
  }, [dispatch]);

  const description =
    'Notification service provides the ability to generate and send notifications based on domain events sent via the event service. This service also includes concepts of subscriptions and subscribers to support management of subscriptions.';

  return (
    <OverviewLayout
      description={description}
      addButton={
        <GoabButton
          testId="add-notification-overview"
          disabled={disabled}
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add notification type
        </GoabButton>
      }
      extra={
        <>
          <EmailInformation />
          <ContactInformation />
          <BotNotifications />
          <NotificationMetrics />
        </>
      }
    />
  );
};
