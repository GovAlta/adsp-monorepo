import React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '@store/index';

import { GoANotification } from '@abgov/react-components';

export function NotificationBanner(): JSX.Element {
  const notifications = useSelector((state: RootState) => state.notifications.notifications);

  return (
    <div style={{ marginBottom: '10px' }}>
      {notifications.length > 0 && (
        <GoANotification key={new Date().getTime()} type="emergency" isDismissable={true}>
          {notifications[notifications.length - 1].message}
        </GoANotification>
      )}
    </div>
  );
}
