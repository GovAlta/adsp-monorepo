import { withRouter, RouteComponentProps } from 'react-router';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import BarChartIcon from '@icons/bar-chart-outline.svg';
import KeyIcon from '@icons/key-outline.svg';
import FileIcon from '@icons/file-outline.svg';
import ReceiptIcon from '@icons/receipt-outline.svg';
import DashboardIcon from '@icons/home-outline.svg';
import LogoutIcon from '@icons/log-out-outline.svg';
import FitnessIcon from '@icons/fitness-outline.svg';
import MegaphoneIcon from '@icons/megaphone-outline.svg';
import NotificationsIcon from '@icons/notifications-outline.svg';
import DirectoryIcon from '@icons/list-outline.svg';
import { GoAIcon } from '@abgov/react-components/experimental';
import { RootState } from '@store/index';
import { TenantAdminLogin, TenantLogout, FetchTenant } from '@store/tenant/actions';

interface SidebarProps {
  type: 'mobile' | 'desktop';
}

const Sidebar = ({ type }: RouteComponentProps & SidebarProps) => {
  const tenantAdminRole = 'tenant-admin';
  const dispatch = useDispatch();

  const { tenantName, authenticated, realm, hasAdminRole } = useSelector((state: RootState) => {
    return {
      tenantName: state.tenant.name,
      authenticated: state.session.authenticated,
      realm: state.session.realm,
      hasAdminRole:
        state.session?.resourceAccess?.['urn:ads:platform:tenant-service']?.roles?.includes(tenantAdminRole),
    };
  });

  useEffect(() => {
    if (realm && authenticated) {
      dispatch(FetchTenant(realm));
    }
  }, [realm, authenticated, dispatch]);

  return (
    <Links>
      {authenticated && (
        <>
          <Title>{tenantName}</Title>
          <NavLink to="/admin" exact={true} activeClassName="current" title="Dashboard" data-testid="menu-dashboard">
            <img src={DashboardIcon} width="16" alt="Admin Dashboard" />
            <span>Dashboard</span>
          </NavLink>
          {hasAdminRole && (
            <>
              <NavLink to="/admin/event-log" activeClassName="current" title="Event log" data-testid="menu-eventLog">
                <img src={ReceiptIcon} width="16" alt="Admin Event log" />
                <span>Event log</span>
              </NavLink>

              <NavLink
                to="/admin/service-metrics"
                activeClassName="current"
                title="Service metrics"
                data-testid="menu-service-metrics"
              >
                <img src={BarChartIcon} width="16" alt="Service metrics" />
                <span>Service metrics</span>
              </NavLink>

              <Title>Services</Title>
              <NavLink to="/admin/access" activeClassName="current" title="Access" data-testid="menu-access">
                <img src={KeyIcon} width="16" alt="Access Service " />
                <span>Access</span>
              </NavLink>
              <NavLink
                to="/admin/services/configuration"
                activeClassName="current"
                title="Configuration"
                data-testid="menu-configuration"
              >
                <GoAIcon type="settings" />
                <span>Configuration</span>
              </NavLink>
              <NavLink
                to="/admin/services/directory"
                activeClassName="current"
                title="Directory"
                data-testid="menu-directory"
              >
                <img src={DirectoryIcon} width="16" alt="Directory Service " />
                <span>Directory</span>
              </NavLink>
              <NavLink to="/admin/services/event" activeClassName="current" title="Event" data-testid="menu-event">
                <img src={MegaphoneIcon} width="16" alt="Events Service" />
                <span>Event</span>
              </NavLink>
              <NavLink to="/admin/services/file" activeClassName="current" title="File" data-testid="menu-file">
                <img src={FileIcon} width="16" alt="Files Service" />
                <span>File</span>
              </NavLink>
              <NavLink
                to="/admin/services/notification"
                activeClassName="current"
                title="Notification"
                data-testid="menu-notification"
              >
                <img src={NotificationsIcon} width="16" alt="Notifications Service" />
                <span>Notification</span>
              </NavLink>
              <NavLink to="/admin/services/pdf" activeClassName="current" title="Pdf" data-testid="menu-pdf">
                <GoAIcon type="document" />
                <span>Pdf</span>
              </NavLink>
              <NavLink to="/admin/services/status" activeClassName="current" title="Status" data-testid="menu-status">
                <img src={FitnessIcon} width="16" alt="Status Service" />
                <span>Status</span>
              </NavLink>
            </>
          )}
        </>
      )}

      {type === 'mobile' && (
        <SignOutLink>
          <hr />
          <LogoutWrapper>
            <img src={LogoutIcon} width="16" alt="Access" />
            {authenticated ? (
              <span
                onClick={() => {
                  dispatch(TenantLogout());
                }}
              >
                Sign out
              </span>
            ) : (
              <span onClick={() => dispatch(TenantAdminLogin())}>Sign In</span>
            )}
          </LogoutWrapper>
        </SignOutLink>
      )}
    </Links>
  );
};

export default withRouter(Sidebar);

const LogoutWrapper = styled.a`
  display: flex;
  cursor: pointer;
`;

const SignOutLink = styled.div`
  display: block;
  @media (min-width: 768px) {
    display: none;
  }
`;

const Links = styled.div`
  padding: 0.5rem;
  a {
    color: #000;
    display: flex;
    align-items: center;
    padding: 0.5rem;
    margin: 0.5rem 0;
    border-radius: 10px;
    overflow-x: hidden;
    white-space: nowrap;
    transition: background-color 100ms;
    text-decoration: none;

    &:first-of-type {
      margin-top: 0;
    }

    &:hover,
    &:focus {
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.8);
      outline: none;
      text-decoration: none;
      color: initial;
    }
    &.current {
      background: rgba(0, 0, 0, 0.05);
      box-shadow: none;
      outline: none;
      text-decoration: none;
      color: initial;
    }
    &:visited {
      color: initial;
    }
    svg {
      display: block;
      width: 18px;
      height: 18px;
    }
    span {
      padding-left: 0.5rem;
      display: block;
    }
  }
`;

const Title = styled.div`
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  text-transform: uppercase;
  padding: 0 0.5rem;
  overflow-x: hidden;
  white-space: nowrap;
  display: none;

  @media (min-width: 768px) {
    display: block;
  }
`;
