import React from 'react';
import BaseApp from '../../baseApp';
import useConfig from '../../utils/useConfig';

function Notifications() {

  const [config,,] = useConfig();

  return (
    <BaseApp>
      <h2>Future notifications</h2>
      {config && `Notification Url: ${config.notificationServiceUrl}`}
    </BaseApp>
  );
}

export default Notifications;
