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

export const alphaBadge = () => {
  return <AlphaBadgeStyle>Alpha</AlphaBadgeStyle>;
};

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
                className={({ isActive }) => `menu-section-link${isActive ? ' current' : ''}`}
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
                  <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) => `menu-section-link${isActive ? ' current' : ''}`}
                    title="Services"
                    data-testid="sidebar-service"
                  >
                    <span>Services</span>
                  </NavLink>
                  {/* <div className="goab-side-menu-heading"> */}
                  {/* <GoabSideMenuHeading>Services</GoabSideMenuHeading> */}
                  {/* </div> */}
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
                    {service.alpha && alphaBadge()}
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
const AlphaBadgeStyle = styled.span`
  height: 20px;
  background-color: var(--goa-microsite-header-alpha-badge-color);
  color: black;
  font-size: var(--goa-font-size-1);
  line-height: 1.5;
  padding: 0 4px 0 4px !important;
`;
const Links = styled.div`
  .goab-side-menu-heading {
    margin: 1rem 1rem 0.25rem 0;
  }

  .goab-side-menu-heading goa-side-menu-heading {
    --goa-side-menu-heading-font-weight: var(--fw-bold);
  }

  a {
    display: flex;
    align-items: center;
    margin-right: 1rem;
    padding-right: 0;

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
      padding-left: 0;
      padding-right: 0.5rem;
      display: block;
    }
  }

  a.menu-section-link,
  .goab-side-menu-heading goa-side-menu-heading {
    color: var(--goa-color-greyscale-700, #333333);
    font-weight: var(--fw-bold);
    margin-bottom: 0.25rem;
  }

  a.menu-section-link span,
  .goab-side-menu-heading goa-side-menu-heading {
    font-weight: var(--fw-bold);
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

<script src="https://feedback-service.adsp-uat.alberta.ca/feedback/v1/script/adspFeedback.js"></script>;
