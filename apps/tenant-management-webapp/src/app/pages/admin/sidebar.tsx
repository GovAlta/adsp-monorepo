import { withRouter, RouteComponentProps } from 'react-router';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import LogoutIcon from '@icons/log-out-outline.svg';

import BetaBadge from '@icons/beta-badge.svg';
import { RootState } from '@store/index';
import { TenantAdminLogin, TenantLogout, FetchTenant } from '@store/tenant/actions';
import { getIdpHint } from '@lib/keycloak';

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
  const betaBadge = () => {
    return (
      <BetaBadgeStyle>
        <img src={BetaBadge} alt="Files Service" />
      </BetaBadgeStyle>
    );
  };
  useEffect(() => {
    if (realm && authenticated) {
      dispatch(FetchTenant(realm));
    }
  }, [realm, authenticated, dispatch]);

  return (
    <Links>
      {authenticated && (
        <>
          <div style={{ paddingBottom: '1rem' }}>
            <Title>{tenantName}</Title>
          </div>
          <NavLink to="/admin" exact={true} activeClassName="current" title="Dashboard" data-testid="menu-dashboard">
            <span>Dashboard</span>
          </NavLink>
          {hasAdminRole && (
            <>
              <NavLink to="/admin/event-log" activeClassName="current" title="Event log" data-testid="menu-eventLog">
                <span>Event log</span>
              </NavLink>
              <NavLink
                to="/admin/service-metrics"
                activeClassName="current"
                title="Service metrics"
                data-testid="menu-service-metrics"
              >
                <span>Service metrics</span>
              </NavLink>
              <Title>Services</Title>
              <NavLink to="/admin/access" activeClassName="current" title="Access" data-testid="menu-access">
                <span>Access</span>
              </NavLink>
              <NavLink
                to="/admin/services/calendar"
                activeClassName="current"
                title="Calendar"
                data-testid="menu-calendar"
              >
                <span>Calendar</span>
                {betaBadge()}
              </NavLink>
              <NavLink
                to="/admin/services/configuration"
                activeClassName="current"
                title="Configuration"
                data-testid="menu-configuration"
              >
                <span>Configuration</span>
              </NavLink>
              <NavLink
                to="/admin/services/directory"
                activeClassName="current"
                title="Directory"
                data-testid="menu-directory"
              >
                <span>Directory</span>
              </NavLink>
              <NavLink to="/admin/services/event" activeClassName="current" title="Event" data-testid="menu-event">
                <span>Event</span>
              </NavLink>
              <NavLink to="/admin/services/file" activeClassName="current" title="File" data-testid="menu-file">
                <span>File</span>
              </NavLink>
              <NavLink
                to="/admin/services/notification"
                activeClassName="current"
                title="Notification"
                data-testid="menu-notification"
              >
                <span>Notification</span>
              </NavLink>
              <NavLink to="/admin/services/pdf" activeClassName="current" title="Pdf" data-testid="menu-pdf">
                <span>PDF</span>
              </NavLink>
              <NavLink to="/admin/services/script" activeClassName="current" title="Script" data-testid="menu-script">
                <span>Script</span>
                {betaBadge()}
              </NavLink>
              <NavLink to="/admin/services/status" activeClassName="current" title="Status" data-testid="menu-status">
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
              <span
                onClick={() => {
                  const idpHint = getIdpHint();
                  dispatch(TenantAdminLogin(idpHint));
                }}
              >
                Sign In
              </span>
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
const BetaBadgeStyle = styled.span`
  height: 20px;
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

    &:hover {
      background: #dcdcdc;
    }
    &:focus {
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.8);
      outline: none;
      text-decoration: none;
      color: #c8eefa;
    }
    &.current {
      background: #c8eefa;
      box-shadow: none;
      outline: none;
      text-decoration: none;
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
  font-size: var(--fs-base);
  font-weight: var(--fw-bold);
  text-transform: capitalize;
  padding: 0 0.5rem;
  overflow-x: hidden;
  white-space: nowrap;
  display: none;
  @media (min-width: 768px) {
    display: block;
  }
`;
