import React, { useEffect, useState } from 'react';
import { Page, Main } from '@components/Html';
import { deleteApplication, fetchServiceStatusApps } from '@store/status/actions';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { ServiceStatusApplication, ServiceStatusEndpoint, ServiceStatusType } from '@store/status/models';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import TrashIcon from '../../../../../../assets/icons/trash-outline.svg';
import PlayIcon from '../../../../../../assets/icons/play-circle-outline.svg';
import PauseIcon from '../../../../../../assets/icons/pause-circle-outline.svg';
import EditIcon from '../../../../../../assets/icons/create-outline.svg';
import WrenchIcon from '../../../../../../assets/icons/build-outline.svg';
import ContextMenu, { ContextMenuItem } from '@components/ContextMenu';
import GoALinkButton from '@components/LinkButton';
import Dialog, { DialogActions, DialogContent, DialogTitle } from '@components/Dialog';
import ApplicationForm from './form';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem } from '@components/Form';
import { setApplicationStatus } from '@store/status/actions/setApplicationStatus';
import GoAChip from '@components/Chip';

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
        <p>This service allows for easy monitoring of application downtime.</p>
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
            <Application key={app.id} {...app} />
          ))}
        </ApplicationList>
      </Main>

      <Switch>
        <Route path="/admin/tenant-admin/services/service-status/new">
          <Dialog open={true}>
            <DialogTitle>New Application</DialogTitle>
            <DialogContent>
              <ApplicationForm />
            </DialogContent>
          </Dialog>
        </Route>
        <Route path="/admin/tenant-admin/services/service-status/:applicationId/edit">
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
  const serviceStatusTypes = ['operational', 'maintenance', 'reported-issues', 'outage', 'pending'];

  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();

  const [status, setStatus] = useState<ServiceStatusType>(props.status);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [showStatusForm, setShowStatusForm] = useState<boolean>(false);

  const contextItems: ContextMenuItem[] = [
    { name: 'manual', icon: WrenchIcon, title: 'Manually Set Status' },
    { name: 'edit', icon: EditIcon, title: 'Edit' },
    {
      name: 'toggle',
      icon: status === 'disabled' ? PlayIcon : PauseIcon,
      title: status === 'disabled' ? 'Enable Monitoring' : 'Disable Monitoring',
    },
    { name: 'delete', icon: TrashIcon, title: 'Remove' },
  ];

  function handleContextAction(action: string) {
    switch (action) {
      case 'manual':
        setShowStatusForm(true);
        break;
      case 'edit':
        history.push(`${location.pathname}/${props.id}/edit`);
        break;
      case 'toggle':
        setStatus(status === 'disabled' ? 'pending' : 'disabled');
        dispatch(
          setApplicationStatus({
            tenantId: props.tenantId,
            applicationId: props.id,
            status: status === 'disabled' ? 'pending' : 'disabled',
          })
        );
        break;
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
    dispatch(deleteApplication({ tenantId: props.tenantId, applicationId: props.id }));
    setShowDeleteConfirmation(false);
  }

  function cancelDelete() {
    setShowDeleteConfirmation(false);
  }

  function doManualStatusChange(status: ServiceStatusType) {
    dispatch(setApplicationStatus({ tenantId: props.tenantId, applicationId: props.id, status }));
    setShowStatusForm(false);
  }

  function cancelManualStatusChange() {
    setShowStatusForm(false);
  }

  function humanizeText(value: string): string {
    return value.replace(/[\W]/, ' ');
  }

  return (
    <App data-testid="application">
      <div className="context-menu">
        <ContextMenu items={contextItems} onAction={(action) => handleContextAction(action)} />
      </div>

      <AppHeader>
        <AppName>{props.name}</AppName>
        &nbsp; &nbsp;
        {props.status === 'operational' ? (
          <GoAChip type="success">{humanizeText(props.status)}</GoAChip>
        ) : (
          <GoAChip type="danger">{humanizeText(props.status)}</GoAChip>
        )}
      </AppHeader>
      <em>Last updated: {getTimestamp()}</em>

      {/* Endpoint List for watched service */}
      <AppEndpoints>
        {props.endpoints.map((endpoint) => (
          <AppEndpoint data-testid="endpoint" key={endpoint.url} endpoint={endpoint}></AppEndpoint>
        ))}
      </AppEndpoints>

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
              {serviceStatusTypes.map((statusType) => (
                <GoAButton
                  key={statusType}
                  onClick={() => doManualStatusChange(statusType as ServiceStatusType)}
                  buttonType="primary"
                >
                  {statusType}
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

function AppEndpoint({ endpoint, ...other }: AppEndpointProps) {
  return (
    <AppEndpointRoot {...other} className={endpoint.status}>
      <div data-testid="endpoint-url">{endpoint.url}</div>
    </AppEndpointRoot>
  );
}

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

const AppEndpoints = styled.div`
  margin-top: 1rem;
`;

const AppEndpointRoot = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '●';
  }

  &.offline::before {
    color: var(--color-red-400);
  }
  &.online::before {
    color: var(--color-green-600);
  }
  &.pending::before {
    color: var(--color-gray-400);
  }
`;
