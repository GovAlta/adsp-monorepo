import React, { useEffect, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { deleteApplication, fetchServiceStatusApps, toggleApplicationStatus } from '@store/status/actions';
import { RootState } from '@store/index';
import ReactTooltip from 'react-tooltip';
import { useDispatch, useSelector } from 'react-redux';
import {
  ServiceStatusType,
  PublicServiceStatusTypes,
  ServiceStatusApplication,
  ServiceStatusEndpoint,
  EndpointStatusEntry,
} from '@store/status/models';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import styled, { CSSProperties } from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import GoALinkButton from '@components/LinkButton';
import { GoAButton, GoARadio, GoARadioGroup } from '@abgov/react-components';
import {
  GoABadge,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
  GoAForm,
  GoAFormItem,
} from '@abgov/react-components/experimental';
import type { GoABadgeType } from '@abgov/react-components/experimental';
import ApplicationFormModal from './form';
import NoticeForm from './noticeForm';
import { setApplicationStatus } from '@store/status/actions/setApplicationStatus';
import { Tab, Tabs } from '@components/Tabs';
import { getNotices } from '@store/notice/actions';
import { NoticeList } from './noticeList';
import SupportLinks from '@components/SupportLinks';

function Status(): JSX.Element {
  const dispatch = useDispatch();

  const { applications, serviceStatusAppUrl, tenantName } = useSelector((state: RootState) => ({
    applications: state.serviceStatus.applications,
    serviceStatusAppUrl: state.config.serviceUrls.serviceStatusAppUrl,
    tenantName: state.tenant.name,
  }));

  const location = useLocation();

  useEffect(() => {
    dispatch(fetchServiceStatusApps());
    const intervalId = setInterval(() => dispatch(fetchServiceStatusApps()), 30000);

    return () => clearInterval(intervalId);
  }, []);

  const publicStatusUrl = `${serviceStatusAppUrl}/${tenantName.replace(/\s/g, '-').toLowerCase()}`;

  const _afterShow = (copyText) => {
    navigator.clipboard.writeText(copyText);
  };

  useEffect(() => {
    dispatch(getNotices());
  }, []);

  return (
    <Page>
      <Main>
        <h2>Service Status</h2>
        <Tabs>
          <Tab label="Overview">
            This service allows for easy monitoring of application downtime.
            <p>
              You can use multiple endpoint URLs for a single application, including internal services you depend on, in
              order to assess which components within an application may be down or malfunctioning (ie. web server,
              database, storage servers, etc)
            </p>
            <p>
              Each Application should represent a service that is useful to the end user by itself, such as child care
              subsidy and child care certification
            </p>
            <GoALinkButton data-testid="add-application" to={`${location.pathname}/new`} buttonType="primary">
              Add Application
            </GoALinkButton>
            <ApplicationList>
              {applications.map((app) => (
                <Application key={app._id} {...app} />
              ))}
            </ApplicationList>
          </Tab>
          <Tab label="Notices">
            <p>
              This service allows for posting of application notices. This allows you to communicate with your customers
              about upcoming maintenance windows or other events
            </p>
            <GoALinkButton data-testid="add-notice" to={`${location.pathname}/notice/new`} buttonType="primary">
              Add a Draft Notice
            </GoALinkButton>
            <NoticeList />
          </Tab>
          <Tab label="Guidelines">
            Guidelines for choosing a health check endpoint:
            <ol>
              <li>A Health check endpoint needs to be publicly accessible over the internet</li>
              <li>
                A Health check endpoint needs to return
                <ul>
                  <li>A 200 level status code to indicate good health</li>
                  <li>A non-200 level status code to indicate bad health.</li>
                </ul>
              </li>
              <li>
                To be most accurate, the health check endpoint should reference a URL that makes comprehensive use of
                your app, and checks connectivity to any databases, for instance.
              </li>
            </ol>
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <h5>Helpful Links</h5>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://gitlab.gov.ab.ca/dio/core/core-services/-/tree/master/apps/status-service"
        >
          See the code
        </a>
        <SupportLinks />

        <h3>Public Status Page</h3>

        <p>Url of the current tenant's public status page:</p>

        <div className="copy-url">{publicStatusUrl}</div>
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

      <Switch>
        <Route path="/admin/services/status/new">
          <ApplicationFormModal isOpen={true} />
        </Route>
        <Route path="/admin/services/status/notice/new">
          <GoAModal isOpen={true}>
            <GoAModalTitle>Add a Draft Notice</GoAModalTitle>
            <GoAModalContent>
              <NoticeForm />
            </GoAModalContent>
          </GoAModal>
        </Route>
        <Route path="/admin/services/status/notice/:noticeId">
          <GoAModal isOpen={true}>
            <GoAModalTitle>Edit Draft Notice</GoAModalTitle>
            <GoAModalContent>
              <NoticeForm />
            </GoAModalContent>
          </GoAModal>
        </Route>
        <Route path="/admin/services/status/:applicationId/edit">
          <ApplicationFormModal isOpen={true} />
        </Route>
      </Switch>
    </Page>
  );
}

function Application(app: ServiceStatusApplication) {
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [showStatusForm, setShowStatusForm] = useState<boolean>(false);
  const [status, setStatus] = useState<ServiceStatusType>(app.status);

  function doDelete() {
    dispatch(deleteApplication({ tenantId: app.tenantId, applicationId: app._id }));
    setShowDeleteConfirmation(false);
  }

  function cancelDelete() {
    setShowDeleteConfirmation(false);
  }

  function doManualStatusChange() {
    dispatch(setApplicationStatus({ tenantId: app.tenantId, applicationId: app._id, status }));
    setShowStatusForm(false);
  }

  function cancelManualStatusChange() {
    setShowStatusForm(false);
  }

  function humanizeText(value: string): string {
    value = value.replace(/[\W]/, ' ');
    return value.substr(0, 1).toUpperCase() + value.substr(1);
  }

  function formatStatus(statusType: string): string {
    return statusType.slice(0, 1).toUpperCase() + statusType.slice(1).replace(/\W/, ' ');
  }

  const publicStatusMap: { [key: string]: GoABadgeType } = {
    operational: 'success',
    maintenance: 'warning',
    'reported-issues': 'emergency',
    outage: 'emergency',
    pending: 'light',
    disabled: 'light',
  };

  return (
    <App data-testid="application">
      {/* Main component content */}
      <AppHeader>
        <div>
          <AppStatus>
            {app.status && <GoABadge type={publicStatusMap[app.status]} content={humanizeText(app.status)} />}
            <GoAButton buttonType="tertiary" buttonSize="small" onClick={() => setShowStatusForm(true)}>
              Change status
            </GoAButton>
          </AppStatus>
        </div>

        <GoAContextMenu>
          <GoAContextMenuIcon type="create" onClick={() => history.push(`${location.pathname}/${app._id}/edit`)} />
          <GoAContextMenuIcon type="trash" onClick={() => setShowDeleteConfirmation(true)} />
        </GoAContextMenu>
      </AppHeader>

      {/* Endpoint List for watched service */}
      <AppName>{app.name}</AppName>
      <AppHealth>
        <HealthBar data-testid="endpoint" displayCount={30} app={app}></HealthBar>
        <GoAButton
          buttonType="tertiary"
          buttonSize="small"
          style={{ flex: '0 0 160px' }}
          onClick={() => {
            dispatch(
              toggleApplicationStatus({
                tenantId: app.tenantId,
                applicationId: app._id,
                enabled: !app.enabled,
              })
            );
          }}
        >
          {app.enabled ? 'Stop health check' : 'Start health check'}
        </GoAButton>
      </AppHealth>

      {/* GoAModals */}

      {/* Delete confirmation dialog */}
      <GoAModal isOpen={showDeleteConfirmation}>
        <GoAModalTitle>Confirmation</GoAModalTitle>
        <GoAModalContent>Delete the {app.name} service status checks?</GoAModalContent>
        <GoAModalActions>
          <GoAButton buttonType="tertiary" onClick={cancelDelete}>
            Cancel
          </GoAButton>
          <GoAButton buttonType="primary" onClick={doDelete}>
            Yes
          </GoAButton>
        </GoAModalActions>
      </GoAModal>

      {/* Manual status change dialog */}
      <GoAModal isOpen={showStatusForm}>
        <GoAModalTitle>Manual Status Change</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem>
              <GoARadioGroup
                name="status"
                value={status}
                onChange={(_name, value) => setStatus(value as ServiceStatusType)}
                orientation="vertical"
              >
                {PublicServiceStatusTypes.map((statusType) => (
                  <GoARadio value={statusType}>{formatStatus(statusType)}</GoARadio>
                ))}
              </GoARadioGroup>
            </GoAFormItem>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton buttonType="tertiary" onClick={cancelManualStatusChange}>
            Cancel
          </GoAButton>

          <GoAButton buttonType="primary" onClick={doManualStatusChange}>
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </App>
  );
}

export default Status;

// ==================
// Private Components
// ==================

interface AppEndpointProps {
  app: ServiceStatusApplication;
  displayCount: number;
}

function HealthBar({ app, displayCount }: AppEndpointProps) {
  const css: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
  };

  function getTimestamp(timestamp: number): string {
    const d = new Date(timestamp);
    const hours = d.getHours();
    const minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    return `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
  }

  /**
   * Generate a list of health checks for the given endpoint and fills in the blank time slots with emtpy entries.
   * @param endpoint The service endpoint
   * @returns
   */
  function getStatusEntries(endpoint: ServiceStatusEndpoint): EndpointStatusEntry[] {
    const timePeriodEntries =
      endpoint.statusEntries?.filter((entry) => entry.timestamp > Date.now() - 1000 * 60 * 30) || [];

    if (timePeriodEntries.length >= displayCount) {
      return timePeriodEntries;
    }

    const makeEntry = (timestamp: number): EndpointStatusEntry => ({
      ok: false,
      timestamp,
      status: 'n/a',
      url: endpoint.url,
      responseTime: -1,
    });
    const minute = 60 * 1000;

    // must define time boundaries to allow for the insertion of filler entries and prevent gaps in time from not showing up
    const entries = [makeEntry(Date.now() - 30 * minute), ...timePeriodEntries, makeEntry(Date.now() + minute)];
    const filledEntries = [];

    for (let i = 1; i < entries.length; i++) {
      const prevEntry = entries[i - 1];
      const entry = entries[i];
      const diff = (entry.timestamp - prevEntry.timestamp) / minute;
      filledEntries.push(prevEntry);
      if (diff > 1) {
        for (let j = 1; j < diff - 1; j++) {
          filledEntries.push(makeEntry(prevEntry.timestamp + j * minute));
        }
      }
    }

    // remove the boundary entries that were inserted previously
    return filledEntries.slice(1);
  }

  const statusEntries = getStatusEntries(app.endpoint);

  return (
    <div style={css}>
      <StatusBarDetails>
        <span></span>
        <small style={{ textTransform: 'capitalize' }}>
          {statusEntries[statusEntries.length - 1].status !== 'n/a' ? app.internalStatus : 'Stopped'}
        </small>
      </StatusBarDetails>

      <EndpointStatusEntries data-testid="endpoint-url">
        {statusEntries.map((entry) => (
          <EndpointStatusTick
            key={entry.timestamp}
            style={{
              backgroundColor: entry.ok
                ? 'var(--color-green)'
                : entry.status === 'n/a'
                ? 'var(--color-gray-300)'
                : 'var(--color-red)',
            }}
            title={entry.status + ': ' + new Date(entry.timestamp).toLocaleString()}
          />
        ))}
      </EndpointStatusEntries>
      <StatusBarDetails>
        <small>{getTimestamp(statusEntries[0]?.timestamp)}</small>
        <small>Now</small>
      </StatusBarDetails>
    </div>
  );
}

const StatusBarDetails = styled.div`
  display: flex;
  justify-content: space-between;
`;

const EndpointStatusEntries = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1px;
`;

const EndpointStatusTick = styled.div`
  flex: 1 1 auto;
  height: 20px;
  &:first-child {
    border-top-left-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
  }
  &:last-child {
    border-top-right-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
  }
`;

// =================
// Styled Components
// =================

const App = styled.div`
  padding: 2rem 0;
  position: relative;
  border-bottom: 1px solid var(--color-gray-400);

  &:last-child {
    border-bottom: none;
  }

  &.disabled {
    filter: grayscale(100%);
    opacity: 0.5;
  }

  .context-menu {
    position: absolute;
    right: 0;
  }
`;

const AppHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  a {
    font-size: var(--fs-sm);
    margin-left: 0.5rem;
  }
`;

const AppHealth = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const AppStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ApplicationList = styled.section`
  margin-top: 2rem;
`;

const AppName = styled.div`
  font-size: var(--fs-lg);
  font-weight: var(--fw-bold);
  text-transform: capitalize;
  margin-top: 1rem;
`;
