import React, { FunctionComponent } from 'react';
import { GoAButton } from '@abgov/react-components';

interface ParentCompProps {
  setActiveEdit?: (boolean) => void;
}

export const NotificationsOverview: FunctionComponent<ParentCompProps> = (props) => {
  const { setActiveEdit } = props;

  return (
    <div>
      <p>
        Notification service provides the ability to generate and send notifications based on domain events sent via the
        event service. This service also includes a concept of subscriptions and subscribers to support management of
        subscriber preferences and unsubscribe.
      </p>
      <GoAButton
        data-testid="add-notification-overview"
        buttonSize="small"
        onClick={() => {
          setActiveEdit(true);
        }}
      >
        Add notification type
      </GoAButton>
    </div>
  );
};
