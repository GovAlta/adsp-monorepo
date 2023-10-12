import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';

import { GoANotification } from '@abgov/react-components-new';
import { clearNotification } from '@store/notifications/actions';
import styled from 'styled-components';

export function NotificationBanner(): JSX.Element {
  const notification = useSelector((state: RootState) => state.notifications.notification);
  const dispatch = useDispatch();
  return (
    <div>
      {notification ? (
        <div style={{ marginBottom: '10px' }}>
          <GoANotification
            key={new Date().getMilliseconds()}
            onDismiss={() => {
              dispatch(clearNotification());
            }}
            type={notification.type}
          >
            <NotificationStyles>
              <div dangerouslySetInnerHTML={{ __html: notification.message }} />
            </NotificationStyles>
          </GoANotification>
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
`;
