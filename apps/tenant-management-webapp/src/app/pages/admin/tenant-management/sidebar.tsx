import { withRouter, RouteComponentProps } from 'react-router';
import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import BarChartIcon from '@icons/bar-chart-outline.svg';
import FileIcon from '@icons/file-outline.svg';
import AdminIcon from '@icons/options-outline.svg';
import DashboardIcon from '@icons/home-outline.svg';
import LogoutIcon from '@icons/log-out-outline.svg';
import FitnessIcon from '@icons/fitness-outline.svg';
import AuthContext from '@lib/authContext';
import { RootState } from '@store/index';
import { TenantAdminLogin, TenantLogout } from '@store/tenant/actions';

interface SidebarProps {
  type: 'mobile' | 'desktop';
}

const Sidebar = ({ type }: RouteComponentProps & SidebarProps) => {
  const authenticated = useSelector((state: RootState) => state.session.authenticated);
  const dispatch = useDispatch();

  return (
    <Links>
      {authenticated && (
        <>
          <Title>Tenant</Title>
          <NavLink to="/admin/tenant-admin" exact={true} activeClassName="current" title="Dashboard">
            <img src={DashboardIcon} width="16" alt="Dashboard" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/tenant-admin/admin" activeClassName="current" title="Administration">
            <img src={AdminIcon} width="16" alt="Admin" />
            <span>Administration</span>
          </NavLink>
          <NavLink to="/admin/tenant-admin/event-log" activeClassName="current" title="Event log">
            <span>Event log</span>
          </NavLink>

          <Title>Services</Title>
          <NavLink to="/admin/tenant-admin/access" activeClassName="current" title="Access">
            <img src={BarChartIcon} width="16" alt="Access" />
            <span>Access</span>
          </NavLink>
          <NavLink to="/admin/tenant-admin/services/file" activeClassName="current" title="Files">
            <img src={FileIcon} width="16" alt="Files" />
            <span>Files</span>
          </NavLink>
          <NavLink to="/admin/tenant-admin/services/service-status" activeClassName="current" title="Status">
            <img src={FitnessIcon} width="16" alt="Status" />
            <span>Status</span>
          </NavLink>
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
                Sign Out
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
