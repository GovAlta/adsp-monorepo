import React from 'react';
import styled from 'styled-components';
import { Notification } from '@store/notifications/models';

interface NotificationProps {
  tag: string;
  notifications: Notification[];
}

export const NotificationContainer = styled.div`
  background-color: red;
  padding: 1rem;
  margin: 1rem 0 1rem 0px;
  color: white;
  border-radius: 5px;
`;

export const Notifications = (props: NotificationProps): JSX.Element => {
  const notifications = props.notifications;
  return (
    <div>
      {notifications.length > 0 ? (
        <NotificationContainer>
          {notifications.map((notification, i) => {
            const key = `${props.tag}-${i}`;
            return (
              <div key={key} data-testid={key}>
                {notification.message}
              </div>
            );
          })}
        </NotificationContainer>
      ) : null}
    </div>
  );
};
