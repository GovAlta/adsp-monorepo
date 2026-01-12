import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';

import { GoabNotification } from '@abgov/react-components';
import { clearNotification } from '@store/notifications/actions';
import styled from 'styled-components';

export function NotificationBanner({ loggedIn }: { loggedIn: boolean }): JSX.Element {
  const notification = useSelector((state: RootState) => state.notifications.notification);

  const dispatch = useDispatch();

  return (
    <div>
      {notification ? (
        <div style={{ marginBottom: '10px' }}>
          <GoabNotification
            key={new Date().getMilliseconds()}
            onDismiss={() => {
              dispatch(clearNotification());
            }}
            type={notification.type}
          >
            <NotificationStyles>
              <div dangerouslySetInnerHTML={{ __html: notification.message }} />
            </NotificationStyles>
          </GoabNotification>
        </div>
      ) : (
        ''
      )}
    </div>
  );
}

export const NotificationStyles = styled.div`
  pre {
    margin: 0 !important;
    padding: 0 !important;
  }

  display: flex;

  .verification-code-button {
    margin-left: 8px;
    margin-top: -4px;
    background: #f75d59;
    border-radius: 5px;
    padding: 2px 1px 2px 0;
  }
`;
