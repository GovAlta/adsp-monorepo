import { Aside, Main, Page } from '@components/Html';

import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { NotificationsOverview } from './overview';
import { NotificationTypes } from './notificationTypes';
import { Subscriptions } from './subscription/subscriptions';
import { Subscribers } from './subscribers';
import { subscriberAppUrlSelector } from './selectors';
import LinkCopyComponent from '@components/CopyLink/CopyLink';

import AsideLinks from '@components/AsideLinks';

export const Notifications: FunctionComponent = () => {
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const tenantName = useSelector((state: RootState) => state.tenant.name);

  const loginUrl = useSelector(subscriberAppUrlSelector);

  const [activateEditState, setActivateEditState] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  useEffect(() => {
    if (activeIndex !== null) {
      setActiveIndex(null);
    }
  }, [activeIndex]);
  function getNotificationDocsLink() {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Notification service`;
  }
  function getNotificationsupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/notification-service';
  }
  return (
    <Page>
      <Main>
        <h1 data-testid="notification-title">Notification service</h1>
        <Tabs activeIndex={activeIndex} data-testid="notification-tabs">
          <Tab label="Overview" data-testid="notification-overview-tab">
            <NotificationsOverview setActiveEdit={activateEdit} />
          </Tab>
          <Tab label="Notification types" data-testid="notification-types-tab">
            <NotificationTypes activeEdit={activateEditState} activateEdit={activateEdit} />
          </Tab>
          <Tab label="Subscriptions" data-testid="notification-subscriptions-tab">
            <Subscriptions />
          </Tab>
          <Tab label="Subscribers" data-testid="notification-subscribers">
            <Subscribers />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <AsideLinks serviceLink={getNotificationsupportcodeLink()} docsLink={getNotificationDocsLink()} />

        <h3>Manage subscriptions</h3>
        <span>Subscribers can manage their subscriptions here:</span>
        <h3>Subscriber app link</h3>
        <LinkCopyComponent text={'Copy link'} link={loginUrl} />
      </Aside>
    </Page>
  );
};
