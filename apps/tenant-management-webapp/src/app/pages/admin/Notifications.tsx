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
        <h1>Future notifications</h1>
        {notificationServiceUrl && `Notification Url: ${notificationServiceUrl}`}
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
}

export default Notifications;
