import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import ReactTooltip from 'react-tooltip';
import React, { FunctionComponent, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { NotificationsOverview } from './overview';
import { NotificationTypes } from './notificationTypes';
import { Subscriptions } from './subscriptions';
import { Subscribers } from './subscribers';
import { GoAButton } from '@abgov/react-components';
import { subscriberAppUrlSelector } from './selectors';

export const Notifications: FunctionComponent = () => {
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);

  const loginUrl = useSelector(subscriberAppUrlSelector);

  const [activateEditState, setActivateEditState] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  const _afterShow = (copyText) => {
    navigator.clipboard.writeText(copyText);
  };

  useEffect(() => {
    if (activeIndex !== null) {
      setActiveIndex(null);
    }
  }, [activeIndex]);

  return (
    <Page>
      <Main>
        <h1>Notifications</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview">
            <NotificationsOverview setActiveEdit={activateEdit} />
          </Tab>
          <Tab label="Notification types">
            <NotificationTypes activeEdit={activateEditState} activateEdit={activateEdit} />
          </Tab>
          <Tab label="Subscriptions">
            <Subscriptions />
          </Tab>
          <Tab label="Subscribers">
            <Subscribers />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <h3>Helpful links</h3>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href={`${docBaseUrl}/{tenantName}&urls.primaryName=Notification service`}
        >
          Read the API docs
        </a>
        <br />
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/notification-service"
        >
          See the code
        </a>
        <SupportLinks />

        <h3>Manage subscriptions</h3>
        <p>Subscribers can manage their subscriptions here:</p>
        <div className="copy-url">
          <a target="_blank" href={loginUrl} rel="noreferrer">
            {loginUrl}
          </a>
        </div>
        <GoAButton data-tip="Copied!" data-for="registerTipUrl">
          Click to copy
        </GoAButton>
        <ReactTooltip
          id="registerTipUrl"
          place="top"
          event="click"
          eventOff="blur"
          effect="solid"
          afterShow={() => _afterShow(loginUrl)}
        />
      </Aside>
    </Page>
  );
};
