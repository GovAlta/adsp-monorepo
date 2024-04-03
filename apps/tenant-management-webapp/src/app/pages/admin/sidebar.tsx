import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import LogoutIcon from '@icons/log-out-outline.svg';

import BetaBadge from '@icons/beta-badge.svg';
import { RootState } from '@store/index';
import { TenantAdminLogin, TenantLogout, FetchTenant } from '@store/tenant/actions';
import { getIdpHint } from '@lib/keycloak';

import { serviceVariables } from '../../../featureFlag';

interface SidebarProps {
  type: 'mobile' | 'desktop';
}

const Sidebar = ({ type }: SidebarProps) => {
  const tenantAdminRole = 'tenant-admin';
  const dispatch = useDispatch();

  const { tenantName, authenticated, realm, hasAdminRole, config } = useSelector((state: RootState) => {
    return {
      tenantName: state.tenant.name,
      config: state.config,
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
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => (isActive ? 'current' : '')}
            title="Dashboard"
            data-testid="menu-dashboard"
          >
            <span>Dashboard</span>
          </NavLink>
          {hasAdminRole && (
            <>
              <NavLink
                to="event-log"
                className={({ isActive }) => (isActive ? 'current' : '')}
                title="Event log"
                data-testid="menu-eventLog"
              >
                <span>Event log</span>
              </NavLink>
              <NavLink
                to="service-metrics"
                className={({ isActive }) => (isActive ? 'current' : '')}
                title="Service metrics"
                data-testid="menu-service-metrics"
              >
                <span>Service metrics</span>
              </NavLink>
              <Title>Services</Title>
              {serviceVariables(config.featureFlags).map((service, index) => (
                <NavLink
                  key={index}
                  to={service.link}
                  className={({ isActive }) => (isActive ? 'current' : '')}
                  title={service.name}
                  data-testid={`menu-${service.name.toLowerCase()}`}
                >
                  <span>{service.name}</span>
                  {service.beta && betaBadge()}
                </NavLink>
              ))}
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
              <span onClick={() => dispatch(TenantLogout())}>Sign out</span>
            ) : (
              <span onClick={() => dispatch(TenantAdminLogin(getIdpHint()))}>Sign In</span>
            )}
          </LogoutWrapper>
        </SignOutLink>
      )}
    </Links>
  );
};

export default Sidebar;

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
  white-space: nowrap;
  display: none;
  @media (min-width: 768px) {
    display: block;
  }
`;
