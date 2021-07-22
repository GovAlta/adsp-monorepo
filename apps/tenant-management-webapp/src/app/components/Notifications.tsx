import React from 'react';
import styled from 'styled-components';
import { Notification } from '@store/notifications/models';

interface NotificationProps {
  tag: string;
  notifications: Notification[];
}

export const NotificationContainer = styled.div`
  background-color: red;
  padding: 8px;
  margin: 5px 0 5px 0px;
  color: white;
  border-radius: 5px;
`;

export const Notifications = (props: NotificationProps) => {
  const notifications = props.notifications.filter((notification) => {
    notification.message.includes(props.tag);
  });
  return (
    <>
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
    </>
  );
};
