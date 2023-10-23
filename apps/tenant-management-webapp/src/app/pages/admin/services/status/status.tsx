import React, { useEffect, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import {
  fetchServiceStatusApps,
  fetchStatusMetrics,
  FETCH_SERVICE_STATUS_APPS_ACTION,
  fetchWebhooks,
} from '@store/status/actions';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { GoACheckbox, GoAButton } from '@abgov/react-components-new';
import ApplicationFormModal from './form';
import { Application } from './applications/application';
import { WebhooksDisplay } from './webhooks/webhooks';

import NoticeModal from './noticeModal';
import { GetMySubscriber, Subscribe, Unsubscribe } from '@store/subscription/actions';
import { Tab, Tabs } from '@components/Tabs';
import { getNotices } from '@store/notice/actions';
import { NoticeList } from './noticeList';

import { renderNoItem } from '@components/NoItem';
import { createSelector } from 'reselect';
import { StatusOverview } from './overview';
import { useActionStateCheck } from '@components/Indicator';
import { ApplicationList } from './styled-components';

import { WebhookFormModal } from './webhookForm';

import LinkCopyComponent from '@components/CopyLink/CopyLink';

import AsideLinks from '@components/AsideLinks';

const userHealthSubscriptionSelector = createSelector(
  (state: RootState) => state.session.userInfo?.sub,
  (state: RootState) => state.subscription.subscribers,
  (state: RootState) => state.subscription.subscriptions,
  (userId, subscribers, subscriptions) => {
    const userSubscriber = userId && Object.values(subscribers).find(({ userId: subUserId }) => subUserId === userId);
    const userSubscription = subscriptions[`status-application-health-change:${userSubscriber?.id}`];

    return userSubscription
      ? {
          ...userSubscription,
          subscriber: userSubscriber,
        }
      : null;
  }
);

function Status(): JSX.Element {
  const dispatch = useDispatch();

  const { applications, serviceStatusAppUrl, tenantName, webhooks } = useSelector((state: RootState) => ({
    applications: state.serviceStatus.applications,
    webhooks: state.serviceStatus.webhooks,
    serviceStatusAppUrl: state.config.serviceUrls.serviceStatusAppUrl,
    tenantName: state.tenant.name,
  }));

  const subscription = useSelector(userHealthSubscriptionSelector);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState<boolean>(false);
  const [showAddWebhookModal, setShowAddWebhookModal] = useState<boolean>(false);
  const [showAddNoticeModal, setShowAddNoticeModal] = useState<boolean>(false);
  const isApplicationsFetched = useActionStateCheck(FETCH_SERVICE_STATUS_APPS_ACTION);

  const defaultHooks = {
    id: '',
    name: '',
    url: '',
    targetId: '',
    intervalMinutes: 5,
    description: '',
    eventTypes: [],
  };
  let intervalId = null;

  useEffect(() => {
    dispatch(fetchServiceStatusApps());
    dispatch(fetchStatusMetrics());
  }, []);

  useEffect(() => {
    if (applications && applications.length > 0 && intervalId === null) {
      intervalId = setInterval(() => dispatch(fetchServiceStatusApps()), 30000);
      return () => {
        if (intervalId !== null) {
          clearInterval(intervalId);
        }
      };
    }
  }, [applications]);

  useEffect(() => {
    dispatch(fetchWebhooks());
  }, []);

  const publicStatusUrl = `${serviceStatusAppUrl}/${tenantName.replace(/\s/g, '-').toLowerCase()}`;

  useEffect(() => {
    dispatch(getNotices());
    dispatch(GetMySubscriber());
  }, []);

  const subscribeToggle = () => {
    if (subscription) {
      dispatch(Unsubscribe({ data: { type: 'status-application-health-change', data: subscription.subscriber } }));
    } else {
      dispatch(Subscribe({ data: { type: 'status-application-health-change' } }));
    }
  };

  const addApplication = (edit: boolean) => {
    setActiveIndex(1);
    setShowAddApplicationModal(edit);
  };
  const addWebhook = (edit: boolean) => {
    setShowAddWebhookModal(edit);
  };

  function getStatussupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/status-service';
  }
  return (
    <Page>
      <Main>
        <h1 data-testid="status-title">Status service</h1>
        <Tabs activeIndex={activeIndex} data-testid="status-tabs">
          <Tab label="Overview" data-testid="status-overview-tab">
            <StatusOverview setActiveEdit={addApplication} setActiveIndex={setActiveIndex} />
          </Tab>
          <Tab label="Applications" data-testid="status-applications-tab">
            <p>
              <GoAButton testId="add-application" onClick={() => addApplication(true)} type="primary">
                Add application
              </GoAButton>
            </p>
            <p>
              <b>Do you want to subscribe and receive notifications for application health changes?</b>
            </p>
            <GoACheckbox
              name="subscribe"
              checked={!!subscription}
              onChange={() => {
                subscribeToggle();
              }}
              value="subscribed"
              ariaLabel="subscribe-checkbox"
              testId="subscribe-checkbox"
            >
              I want to subscribe and receive notifications
            </GoACheckbox>
            {isApplicationsFetched === true && applications.length === 0 && renderNoItem('application')}
            <ApplicationList>
              {applications.map((app) => (
                <Application key={app.appKey} {...app} />
              ))}
            </ApplicationList>
          </Tab>
          <Tab label="Webhook" data-testid="status-webhook">
            <p>The webhooks are listed here</p>
            <p>
              <GoAButton testId="add-application" onClick={() => addWebhook(true)} type="primary">
                Add webhook
              </GoAButton>
            </p>

            {webhooks && Object.keys(webhooks).length > 0 ? (
              <WebhooksDisplay webhooks={webhooks} />
            ) : (
              <b>There are no webhooks yet</b>
            )}
          </Tab>
          <Tab label="Notices" data-testid="status-notices">
            <NoticeModal
              isOpen={showAddNoticeModal}
              title="Add notice"
              onCancel={() => {
                setShowAddNoticeModal(false);
              }}
              onSave={() => {
                setShowAddNoticeModal(false);
              }}
            />

            <p>
              This service allows for posting of application notices. This allows you to communicate with your customers
              about upcoming maintenance windows or other events
            </p>
            <GoAButton
              testId="add-notice"
              onClick={() => {
                setShowAddNoticeModal(true);
              }}
              type="primary"
            >
              Add notice
            </GoAButton>
            <NoticeList />
          </Tab>
        </Tabs>
        <ApplicationFormModal
          isOpen={showAddApplicationModal}
          testId={'add-application'}
          isEdit={false}
          title="Add application"
          onCancel={() => {
            setShowAddApplicationModal(false);
          }}
          onSave={() => {
            if (activeIndex !== 1) {
              setActiveIndex(1);
            }
            setShowAddApplicationModal(false);
          }}
          defaultApplication={{
            name: '',
            appKey: '',
            tenantId: '',
            enabled: false,
            description: '',
            endpoint: { url: '', status: 'offline' },
          }}
        />
        <WebhookFormModal
          defaultWebhooks={defaultHooks}
          isOpen={showAddWebhookModal}
          testId={'add-webhook'}
          isEdit={false}
          title="Add webhook"
          onCancel={() => {
            setShowAddWebhookModal(false);
          }}
          onSave={() => {
            setShowAddWebhookModal(false);
          }}
        />
      </Main>

      <Aside>
        <>
          <AsideLinks serviceLink={getStatussupportcodeLink()} />
        </>
        <h3>Public status page</h3>

        <p>Url of the current tenant's public status page:</p>
        <h3>Status page link</h3>
        <LinkCopyComponent text={'Copy link'} link={publicStatusUrl} />
      </Aside>
    </Page>
  );
}
export default Status;
