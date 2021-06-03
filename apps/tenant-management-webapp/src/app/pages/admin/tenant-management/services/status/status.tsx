import React, { useEffect, useState } from 'react';
import { Page, Main } from '@components/Html';
import { deleteApplication, fetchServiceStatusApps } from '@store/status/actions';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { ServiceStatusApplication, ServiceStatusEndpoint } from '@store/status/models';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import TrashIcon from '../../../../../../assets/icons/trash-outline.svg';
import PlayIcon from '../../../../../../assets/icons/play-circle-outline.svg';
import PauseIcon from '../../../../../../assets/icons/pause-circle-outline.svg';
import EditIcon from '../../../../../../assets/icons/create-outline.svg';
import ContextMenu, { ContextMenuItem } from '@components/ContextMenu';
import GoALinkButton from '@components/LinkButton';
import { toggleApplication } from '@store/status/actions/toggleApplication';
import Dialog from '@components/Dialog';
import ApplicationForm from './form';

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
            <Application key={app.id} {...app} />
          ))}
        </ApplicationList>
      </Main>

      <Switch>
        <Route path="/admin/tenant-admin/services/service-status/new">
          <Dialog open={true}>
            <ApplicationForm />
          </Dialog>
        </Route>
        <Route path="/admin/tenant-admin/services/service-status/:applicationId/edit">
          <Dialog open={true}>
            <ApplicationForm />
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

  const [enabled, setEnabled] = useState<boolean>(props.enabled);

  const contextItems: ContextMenuItem[] = [
    { name: 'edit', icon: EditIcon, title: 'Edit' },
    { name: 'toggle', icon: enabled ? PauseIcon : PlayIcon, title: enabled ? "Disable Monitoring" : 'Enable Monitoring' },
    { name: 'delete', icon: TrashIcon, title: 'Remove' },
  ];

  function handleContextAction(action: string) {
    switch (action) {
      case 'edit':
        history.push(`${location.pathname}/${props.id}/edit`);
        break;
      case 'toggle':
        setEnabled(!enabled);
        dispatch(toggleApplication({ tenantId: props.tenantId, applicationId: props.id, enabled: !enabled }));
        break;
      case 'delete': {
        if (window.confirm(`Do you want to delete the ${props.name} application?`)) {
          dispatch(deleteApplication({ tenantId: props.tenantId, applicationId: props.id }));
        }
        break;
      }
    }
  }

  return (
    <App data-testid="application" className={props.enabled ? 'enabled' : 'disabled'}>
      <div className="context-menu">
        <ContextMenu items={contextItems} onAction={(action) => handleContextAction(action)} />
      </div>
      <AppHeader>
        <Inline>
          <AppName>{props.name}</AppName>
        </Inline>
      </AppHeader>
      <AppEndpoints>
        {props.endpoints.map((endpoint) => (
          <AppEndpoint
            data-testid="endpoint"
            key={endpoint.url}
            enabled={props.enabled}
            endpoint={endpoint}
          ></AppEndpoint>
        ))}
      </AppEndpoints>
    </App>
  );
}

export default Status;

// ==================
// Private Components
// ==================

interface AppEndpointProps {
  endpoint: ServiceStatusEndpoint;
  enabled: boolean;
}

function AppEndpoint({ endpoint, enabled, ...other }: AppEndpointProps) {
  return (
    <AppEndpointRoot {...other} className={enabled ? endpoint.status : 'unknown'}>
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
  padding-left: 1rem;
  margin-bottom: 0.5rem;
  background-color: var(--color-gray-100);
  border-left: 0.5rem solid var(--color-gray-300);
  &.enabled {
    border-left: 0.5rem solid var(--color-green-400);
  }
  &.disabled {
    border-left: 0.5rem solid var(--color-gray-300);
  }
  &.error {
    border-left: 0.5rem solid var(--color-red-400);
  }

  &:hover,
  &:active {
    .context-menu {
      display: block;
    }
  }

  .context-menu {
    display: none;
    position: absolute;
    top: -1rem;
    right: 0;
  }
`;

const Inline = styled.div`
  display: flex;
  align-items: baseline;
`;

const AppHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.5rem;
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

const AppEndpoints = styled.div``;

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
  &.unknown::before {
    color: var(--color-gray-400);
  }
`;
