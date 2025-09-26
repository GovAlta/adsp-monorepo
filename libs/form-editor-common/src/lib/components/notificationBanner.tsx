import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/index';
import { GoANotification } from '@abgov/react-components';
import { DismissNotification } from '../store/notifications/actions';
import styled from 'styled-components';

export function NotificationBanner(): JSX.Element {
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );

  const dispatch = useDispatch();

  return (
    <div style={{ marginBottom: '10px' }}>
      {latestNotification && !latestNotification.disabled && (
        <GoANotification
          key={latestNotification.id}
          type={latestNotification.type || 'emergency'}
          onDismiss={() => dispatch(DismissNotification(latestNotification))}
        >
          <NotificationStyles>
            <div dangerouslySetInnerHTML={{ __html: latestNotification.message }} />
          </NotificationStyles>
        </GoANotification>
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
