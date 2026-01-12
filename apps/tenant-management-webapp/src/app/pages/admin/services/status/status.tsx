import React, { useEffect, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { fetchServiceStatusApps, fetchStatusMetrics, FETCH_SERVICE_STATUS_APPS_ACTION } from '@store/status/actions';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { GoabCheckbox, GoabButton } from '@abgov/react-components';
import ApplicationFormModal from './form';
import { Application } from './applications/application';
import { WebhookListTable } from './webhooks/webhooks';

import NoticeModal from './notices/noticeModal';
import { GetMySubscriber, Subscribe, Unsubscribe } from '@store/subscription/actions';
import { Tab, Tabs } from '@components/Tabs';
import { getNotices } from '@store/notice/actions';
import { NoticeList } from './notices/noticeList';

import { renderNoItem } from '@components/NoItem';
import { createSelector } from 'reselect';
import { StatusOverview } from './overview';
import { useActionStateCheck } from '@components/Indicator';
import { ApplicationList } from './styled-components';

import { WebhookFormModal } from './webhooks/webhookForm';
import LinkCopyComponent from '@components/CopyLink/CopyLink';
import AsideLinks from '@components/AsideLinks';
import { AddEditStatusWebhookType } from '@store/status/models';
import { UpdateModalState } from '@store/session/actions';

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

  const { applications, serviceStatusAppUrl, tenantName } = useSelector((state: RootState) => ({
    applications: state.serviceStatus.applications,
    serviceStatusAppUrl: state.config.serviceUrls.serviceStatusAppUrl,
    tenantName: state.tenant.name,
  }));

  const subscription = useSelector(userHealthSubscriptionSelector);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState<boolean>(false);
  const [showAddNoticeModal, setShowAddNoticeModal] = useState<boolean>(false);
  const isApplicationsFetched = useActionStateCheck(FETCH_SERVICE_STATUS_APPS_ACTION);

  let intervalId = null;

  useEffect(() => {
    dispatch(fetchServiceStatusApps());
    dispatch(fetchStatusMetrics());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (applications && applications.length > 0 && intervalId === null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      intervalId = setInterval(() => dispatch(fetchServiceStatusApps()), 30000);
      return () => {
        if (intervalId !== null) {
          clearInterval(intervalId);
        }
      };
    }
  }, [applications]);

  const publicStatusUrl = `${serviceStatusAppUrl}/${tenantName.replace(/\s/g, '-').toLowerCase()}`;

  useEffect(() => {
    dispatch(getNotices());
    dispatch(GetMySubscriber());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <Page>
      <Main>
        <h1 data-testid="status-title">Status service</h1>
        <Tabs activeIndex={activeIndex} data-testid="status-tabs">
          <Tab label="Overview" data-testid="status-overview-tab">
            <StatusOverview setActiveEdit={addApplication} setActiveIndex={setActiveIndex} />
          </Tab>
          <Tab label="Applications" data-testid="status-applications-tab">
            <section>
              <p>
                <GoabButton testId="add-application" onClick={() => addApplication(true)} type="primary">
                  Add application
                </GoabButton>
              </p>
              <p>
                <b>Do you want to subscribe and receive notifications for application health changes?</b>
              </p>
              <GoabCheckbox
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
              </GoabCheckbox>
              {isApplicationsFetched === true && applications.length === 0 && renderNoItem('application')}
              <ApplicationList>
                {applications.map((app) => (
                  <Application key={app.appKey} {...app} />
                ))}
              </ApplicationList>
            </section>
          </Tab>
          <Tab label="Webhook" data-testid="status-webhook">
            <section>
              <p>The webhooks are listed here</p>
              <p>
                <GoabButton
                  testId="add-application"
                  onClick={() => {
                    dispatch(
                      UpdateModalState({
                        type: AddEditStatusWebhookType,
                        isOpen: true,
                        id: null,
                      })
                    );
                  }}
                  type="primary"
                >
                  Add webhook
                </GoabButton>
              </p>

              <WebhookListTable />
            </section>
          </Tab>
          <Tab label="Notices" data-testid="status-notices">
            <section>
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
                This service allows for posting of application notices. This allows you to communicate with your
                customers about upcoming maintenance windows or other events
              </p>
              <GoabButton
                testId="add-notice"
                onClick={() => {
                  setShowAddNoticeModal(true);
                }}
                type="primary"
              >
                Add notice
              </GoabButton>
              <NoticeList />
            </section>
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
        <WebhookFormModal />
      </Main>

      <Aside>
        <AsideLinks serviceName="status" />

        <h3>Public status page</h3>

        <p>Url of the current tenant's public status page:</p>
        <h3>Status page link</h3>
        <LinkCopyComponent text={'Copy link'} link={publicStatusUrl} />
      </Aside>
    </Page>
  );
}
export default Status;
