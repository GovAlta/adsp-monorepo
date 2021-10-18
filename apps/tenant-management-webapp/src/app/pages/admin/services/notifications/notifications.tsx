import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { NotificationsOverview } from './overview';
import { NotificationTypes } from './notificationTypes';

export const Notifications: FunctionComponent = () => {
  const tenantId = useSelector((state: RootState) => state.tenant?.id);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  return (
    <Page>
      <Main>
        <h2>Notifications</h2>
        <Tabs>
          <Tab label="Overview">
            <NotificationsOverview />
          </Tab>
          <Tab label="Notification Types">
            <NotificationTypes />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <h5>Helpful Links</h5>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href={`${docBaseUrl}?tenant=${tenantId}&urls.primaryName=Notification Service`}
        >
          Read the API docs
        </a>
        <br />
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://gitlab.gov.ab.ca/dio/core/core-services/-/tree/master/apps/event-service"
        >
          See the code
        </a>
        <SupportLinks />
      </Aside>
    </Page>
  );
};
