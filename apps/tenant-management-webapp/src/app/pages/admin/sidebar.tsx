import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import BetaBadge from '@icons/beta-badge.svg';
import { RootState } from '@store/index';
import { FetchTenant } from '@store/tenant/actions';

import { serviceVariables } from '../../../featureFlag';
import { GoabSideMenu, GoabSideMenuHeading } from '@abgov/react-components';

interface SidebarProps {
  type: 'mobile' | 'desktop';
}

const Sidebar = ({ type }: SidebarProps) => {
  const tenantAdminRole = 'tenant-admin';
  const dispatch = useDispatch();

  const { tenantName, authenticated, realm, hasAdminRole, config } = useSelector((state: RootState) => {
    return {
      tenantName: state.tenant.name.replace(/[-_]/g, ' '),
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
    <>
      <Title>{tenantName}</Title>
      <Links>
        <GoabSideMenu>
          {authenticated && (
            <>
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
                  <GoabSideMenuHeading>Services</GoabSideMenuHeading>
                </>
              )}
              {hasAdminRole &&
                serviceVariables(config.featureFlags).map((service, index) => (
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
        </GoabSideMenu>
      </Links>
    </>
  );
};

export default Sidebar;

const BetaBadgeStyle = styled.span`
  height: 20px;
`;
const Links = styled.div`
  a {
    display: flex;
    align-items: center;

    &:first-of-type {
      margin-top: 0;
    }

    &:hover {
      background: #cedfee;
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
  font-size: var(--goa-font-size-4);
  font-weight: var(--fw-bold);
  padding: 0 0 0.5rem;
  display: none;
  &::first-letter {
    text-transform: capitalize;
  }
  @media (min-width: 768px) {
    display: block;
  }
`;
