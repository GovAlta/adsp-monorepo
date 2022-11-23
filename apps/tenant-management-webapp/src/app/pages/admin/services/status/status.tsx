import React, { useEffect, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { fetchServiceStatusApps, fetchStatusMetrics, FETCH_SERVICE_STATUS_APPS_ACTION } from '@store/status/actions';
import { RootState } from '@store/index';
import ReactTooltip from 'react-tooltip';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoACheckbox } from '@abgov/react-components';
import ApplicationFormModal from './form';
import { Application } from './applications/application';
import NoticeModal from './noticeModal';
import { GetMySubscriber, Subscribe, Unsubscribe } from '@store/subscription/actions';
import { Tab, Tabs } from '@components/Tabs';
import { getNotices } from '@store/notice/actions';
import { NoticeList } from './noticeList';
import SupportLinks from '@components/SupportLinks';
import { renderNoItem } from '@components/NoItem';
import { createSelector } from 'reselect';
import { StatusOverview } from './overview';
import { useActionStateCheck } from '@components/Indicator';
import { ApplicationList } from './styled-components';

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

  useEffect(() => {
    dispatch(fetchServiceStatusApps());
    dispatch(fetchStatusMetrics());
  }, []);

  useEffect(() => {
    if (applications && applications.length > 0) {
      const intervalId = setInterval(() => dispatch(fetchServiceStatusApps()), 30000);
      return () => clearInterval(intervalId);
    }
  }, [applications]);

  const publicStatusUrl = `${serviceStatusAppUrl}/${tenantName.replace(/\s/g, '-').toLowerCase()}`;

  const _afterShow = (copyText) => {
    navigator.clipboard.writeText(copyText);
  };

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

  return (
    <Page>
      <Main>
        {showAddApplicationModal && (
          <ApplicationFormModal
            isOpen={true}
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
        )}
        <h1 data-testid="status-title">Status service</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview">
            <StatusOverview setActiveEdit={addApplication} setActiveIndex={setActiveIndex} />
          </Tab>
          <Tab label="Applications">
            <p>
              <GoAButton data-testid="add-application" onClick={() => addApplication(true)} buttonType="primary">
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
          <Tab label="Notices">
            {showAddNoticeModal && (
              <NoticeModal
                isOpen={true}
                title="Add notice"
                onCancel={() => {
                  setShowAddNoticeModal(false);
                }}
                onSave={() => {
                  setShowAddNoticeModal(false);
                }}
              />
            )}
            <p>
              This service allows for posting of application notices. This allows you to communicate with your customers
              about upcoming maintenance windows or other events
            </p>
            <GoAButton
              data-testid="add-notice"
              onClick={() => {
                setShowAddNoticeModal(true);
              }}
              buttonType="primary"
            >
              Add notice
            </GoAButton>
            <NoticeList />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <h3>Helpful links</h3>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/status-service"
        >
          See the code
        </a>
        <SupportLinks />

        <h3>Public status page</h3>

        <p>Url of the current tenant's public status page:</p>

        <div className="copy-url">
          <a target="_blank" href={publicStatusUrl} rel="noreferrer">
            {publicStatusUrl}
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
          afterShow={() => _afterShow(publicStatusUrl)}
        />
      </Aside>
    </Page>
  );
}
export default Status;
