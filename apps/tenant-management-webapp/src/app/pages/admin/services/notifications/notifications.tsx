import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { NotificationsOverview } from './overview';
import {NotificationsTypes} from "@pages/admin/services/notifications/types";

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
            <NotificationsTypes />
          </Tab>
        </Tabs>
      </Main>
    </Page>
  );
};
