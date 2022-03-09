import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';

import { GoANotification } from '@abgov/react-components';
import { clearNotification } from '@store/notifications/actions';

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
            isDismissable={true}
          >
            {notification.message}
          </GoANotification>
        </div>
      ) : (
        ''
      )}
    </div>
  );
}
