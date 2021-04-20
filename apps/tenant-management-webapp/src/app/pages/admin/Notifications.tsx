import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';

function Notifications() {
  const notificationServiceUrl = useSelector((state: RootState) => state.config.serviceUrls.notificationServiceUrl);

  return (
    <Page>
      <Main>
        <h2>Future notifications</h2>
        {notificationServiceUrl && `Notification Url: ${notificationServiceUrl}`}
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
}

export default Notifications;
