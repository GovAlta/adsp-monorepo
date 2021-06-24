import React, { useEffect, useState } from 'react';
import { Page, Main } from '@components/Html';
import { deleteApplication, fetchServiceStatusApps } from '@store/status/actions';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import {
  InternalServiceStatusType,
  PublicServiceStatusType,
  PublicServiceStatusTypes,
  ServiceStatusApplication,
  ServiceStatusEndpoint,
} from '@store/status/models';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import ContextMenu, { ContextMenuItem } from '@components/ContextMenu';
import GoALinkButton from '@components/LinkButton';
import Dialog, { DialogActions, DialogContent, DialogTitle } from '@components/Dialog';
import ApplicationForm from './form';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem } from '@components/Form';
import { setApplicationStatus } from '@store/status/actions/setApplicationStatus';
import GoAChip, { ChipType } from '@components/Chip';
import { Tab, Tabs } from '@components/Tabs';

// icons
import TrashIcon from '@assets/icons/trash-outline.svg';
import PlayIcon from '@assets/icons/play-circle-outline.svg';
import PauseIcon from '@assets/icons/pause-circle-outline.svg';
import EditIcon from '@assets/icons/create-outline.svg';
import WrenchIcon from '@assets/icons/build-outline.svg';
import CheckmarkCircle from '@components/icons/CheckmarkCircle';
import CloseCircle from '@components/icons/CloseCircle';
import Hourglass from '@components/icons/Hourglass';

function Status(): JSX.Element {
  const dispatch = useDispatch();
  const applications = useSelector((state: RootState) => {
    return state.serviceStatus.applications;
  });
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchServiceStatusApps());
    const intervalId = setInterval(() => dispatch(fetchServiceStatusApps()), 30000);

    return () => clearInterval(intervalId);
  }, [dispatch]);

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
        <GoALinkButton data-testid="add-application" to={`${location.pathname}/new`} buttonType="primary">
          Add Application
        </GoALinkButton>
        <ApplicationList>
          {applications.map((app) => (
            <Application key={app._id} {...app} />
          ))}
        </ApplicationList>
      </Main>

      <Switch>
        <Route path="/admin/services/status/new">
          <Dialog open={true}>
            <DialogTitle>New Application</DialogTitle>
            <DialogContent>
              <ApplicationForm />
            </DialogContent>
          </Dialog>
        </Route>
        <Route path="/admin/services/status/:applicationId/edit">
          <Dialog open={true}>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogContent>
              <ApplicationForm />
            </DialogContent>
          </Dialog>
        </Route>
      </Switch>
    </Page>
  );
}

function Application(props: ServiceStatusApplication) {
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();

  const [status, setStatus] = useState<InternalServiceStatusType>(props.internalStatus);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [showStatusForm, setShowStatusForm] = useState<boolean>(false);

  const contextItems: ContextMenuItem[] = [
    { name: 'manual', icon: WrenchIcon, title: 'Manually Set Status' },
    { name: 'edit', icon: EditIcon, title: 'Edit' },
    {
      name: 'toggle',
      icon: status === 'disabled' ? PlayIcon : PauseIcon,
      title: status === 'disabled' ? 'Start Monitoring' : 'Stop Monitoring',
    },
    { name: 'delete', icon: TrashIcon, title: 'Remove' },
  ];

  function handleContextAction(action: string) {
    switch (action) {
      case 'manual':
        setShowStatusForm(true);
        break;
      case 'edit':
        history.push(`${location.pathname}/${props._id}/edit`);
        break;
      case 'toggle': {
        const toggledStatus = status === 'disabled' ? 'pending' : 'disabled';
        setStatus(toggledStatus);
        dispatch(
          setApplicationStatus({
            tenantId: props.tenantId,
            applicationId: props._id,
            type: 'internal',
            status: toggledStatus,
          })
        );
        break;
      }
      case 'delete': {
        setShowDeleteConfirmation(true);
        break;
      }
    }
  }

  function getTimestamp() {
    const d = new Date(props.statusTimestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

  function doDelete() {
    dispatch(deleteApplication({ tenantId: props.tenantId, applicationId: props._id }));
    setShowDeleteConfirmation(false);
  }

  function cancelDelete() {
    setShowDeleteConfirmation(false);
  }

  function doManualStatusChange(status: PublicServiceStatusType) {
    dispatch(setApplicationStatus({ tenantId: props.tenantId, applicationId: props._id, type: 'public', status }));
    setShowStatusForm(false);
  }

  function cancelManualStatusChange() {
    setShowStatusForm(false);
  }

  function humanizeText(value: string): string {
    if (!value) return 'n/a';
    return value.replace(/[\W]/, ' ');
  }

  const publicStatusMap: { [key: string]: ChipType } = {
    operational: 'success',
    maintenance: 'warning',
    outage: 'danger',
    disabled: 'secondary',
  };

  return (
    <App data-testid="application">
      <div className="context-menu">
        <ContextMenu items={contextItems} onAction={(action) => handleContextAction(action)} />
      </div>

      <AppHeader>
        <AppName>{props.name}</AppName>
        {props.publicStatus && (
          <>
            <span className="space-1"></span>
            <GoAChip type={publicStatusMap[props.publicStatus]}>{humanizeText(props.publicStatus)}</GoAChip>
          </>
        )}
      </AppHeader>
      <em>Last updated: {getTimestamp()}</em>

      {/* Endpoint List for watched service */}
      {props.internalStatus !== 'disabled' && (
        <>
          <AppEndpointsStatus status={props.internalStatus}>
            {props.internalStatus === 'operational' && <CheckmarkCircle size="medium" />}
            {props.internalStatus === 'reported-issues' && <CloseCircle size="medium" />}
            {props.internalStatus === 'pending' && <Hourglass size="medium" />}
            {humanizeText(props.internalStatus)}
          </AppEndpointsStatus>
          <AppEndpoints>
            {props.endpoints.map((endpoint) => (
              <AppEndpoint data-testid="endpoint" key={endpoint.url} endpoint={endpoint}></AppEndpoint>
            ))}
          </AppEndpoints>
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirmation} onClose={cancelDelete}>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>Delete the {props.name} service status checks?</DialogContent>
        <DialogActions>
          <GoAButton buttonType="tertiary" onClick={cancelDelete}>
            Cancel
          </GoAButton>
          <GoAButton buttonType="primary" onClick={doDelete}>
            Yes
          </GoAButton>
        </DialogActions>
      </Dialog>

      {/* Manual status change dialog */}
      <Dialog open={showStatusForm} onClose={cancelManualStatusChange}>
        <DialogTitle>Manual Status Change</DialogTitle>
        <DialogContent>
          <GoAForm>
            <GoAFormItem>
              {PublicServiceStatusTypes.map((statusType) => (
                <GoAButton
                  key={statusType}
                  onClick={() => doManualStatusChange(statusType as PublicServiceStatusType)}
                  buttonType="primary"
                >
                  <span style={{ textTransform: 'capitalize' }}>{statusType}</span>
                </GoAButton>
              ))}
            </GoAFormItem>
          </GoAForm>
        </DialogContent>
        <DialogActions>
          <GoAButton buttonType="tertiary" onClick={cancelManualStatusChange}>
            Cancel
          </GoAButton>
          <GoAButton buttonType="primary">Save</GoAButton>
        </DialogActions>
      </Dialog>
    </App>
  );
}

export default Status;

// ==================
// Private Components
// ==================

interface AppEndpointProps {
  endpoint: ServiceStatusEndpoint;
}

function AppEndpoint({ endpoint }: AppEndpointProps) {
  return (
    <div data-testid="endpoint-url">
      <b>{endpoint.url}</b>
      {endpoint.statusEntries?.map((entry) => (
        <EndpointStatusEntry key={entry.timestamp}>
          {entry.ok ? <CheckmarkCircle size="small" /> : <CloseCircle size="small" />}
          <div>
            {entry.status}: {entry.timestamp && new Date(entry.timestamp).toLocaleTimeString()}
          </div>
        </EndpointStatusEntry>
      ))}
    </div>
  );
}

const EndpointStatusEntry = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

// =================
// Styled Components
// =================

const App = styled.div`
  padding: 1rem 0;
  position: relative;
  border-bottom: 1px solid var(--color-gray-200);

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
  align-items: center;
  a {
    font-size: var(--fs-sm);
    margin-left: 0.5rem;
  }
`;

const ApplicationList = styled.section`
  margin-top: 2rem;
`;

const AppName = styled.div`
  font-size: var(--fs-lg);
  font-weight: var(--fw-medium);
  text-transform: capitalize;
`;

const AppEndpointsStatus = styled.div<{ status: string }>`
  margin-top: 1rem;
  text-transform: capitalize;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: var(--fw-bold);
  color: ${(props) => (props.status === 'operational' ? 'var(--color-notice-success)' : 'var(--color--notice-error)')};
`;

const AppEndpoints = styled.div`
  margin-left: 1.75rem;
  font-size: var(--fs-sm);

  b {
    color: var(--color-gray-800);
  }
`;
