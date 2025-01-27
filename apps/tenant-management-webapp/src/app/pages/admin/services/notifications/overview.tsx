import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GoAButton } from '@abgov/react-components-new';
import { FetchNotificationMetrics } from '@store/notification/actions';
import { NotificationMetrics } from './metrics';
import { ContactInformation } from './contactInformation';
import { EmailInformation } from './emailInformation/emailSection';
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
        <GoAButton
          testId="add-notification-overview"
          disabled={disabled}
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add notification type
        </GoAButton>
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
