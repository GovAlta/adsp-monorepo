import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { GoANotification } from '@abgov/react-components';
import { DismissNotification } from '@store/notifications/actions';

export function NotificationBanner(): JSX.Element {
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );

  const dispatch = useDispatch();

  return (
    <div style={{ marginBottom: '10px' }}>
      {latestNotification && !latestNotification.disabled && (
        <GoANotification
          type={latestNotification.type || 'emergency'}
          isDismissable={true}
          onDismiss={() => dispatch(DismissNotification(latestNotification))}
        >
          {latestNotification.message}
        </GoANotification>
      )}
    </div>
  );
}
