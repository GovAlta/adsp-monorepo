import React, { useContext, useState } from 'react';
import { GoAHeader } from '@abgov/react-components';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { RootState } from '@store/index';
import Sidebar from '@pages/admin/tenant-management/sidebar';
import MenuIcon from '@icons/menu-outline.svg';
import CloseIcon from '@icons/close-outline.svg';
import { ReactComponent as UserIcon } from '@icons/person-circle-outline.svg';
import { TenantAdminLogin, TenantLogout } from '@store/tenant/actions';

interface HeaderMenuProps {
  hasLoginLink: boolean;
}

const ActionsMenu = (props: HeaderMenuProps) => {
  const authenticated = useSelector((state: RootState) => state.session.authenticated);
  const dispatch = useDispatch();
  const [menuState, setMenuState] = useState<MenuState>({ state: 'closed' });

  function toggleMenu() {
    setMenuState({ state: menuState.state === 'closed' ? 'open' : 'closed' });
  }
  return (
    <Actions>
      <section className="mobile">
        <SidebarController onClick={toggleMenu}>
          <img src={MenuIcon} width="24" alt="Menu" />
          <SidebarWrapper state={menuState.state}>
            <div className="close">
              <img src={CloseIcon} width="24" alt="Close" />
            </div>
            <Sidebar type="mobile" />
          </SidebarWrapper>
        </SidebarController>
      </section>

      {props.hasLoginLink ? (
        <section className="desktop">
          {authenticated ? (
            <UserIconBox>
              <UserIcon />
              <Link to={''} onClick={() => dispatch(TenantLogout())}>
                Sign Out
              </Link>
            </UserIconBox>
          ) : (
            <Link
              to={''}
              onClick={() => {
                dispatch(TenantAdminLogin());
              }}
            >
              Sign In
            </Link>
          )}
        </section>
      ) : null}
    </Actions>
  );
};

function AppHeader({ serviceName = '', hasLoginLink = true }) {
  return (
    <HeaderContainer>
      <GoAHeader serviceHome="/" serviceLevel="alpha" serviceName={serviceName} />
      <ActionsMenu hasLoginLink={hasLoginLink} />
    </HeaderContainer>
  );
}

export default AppHeader;

// =================
// Styled Components
// =================

interface MenuState {
  state: 'open' | 'closed';
}

const SidebarController = styled.div`
  display: flex;
  align-items: center;
`;

const SidebarWrapper = styled.div<MenuState>`
  position: absolute;
  top: 0;
  right: ${(menu: MenuState) => (menu.state === 'open' ? '0' : '-15rem')};
  transition: right 200ms;
  min-height: 100vh;
  z-index: 1;
  background-color: #fff;
  box-shadow: -10px 0 8px ${(menu: MenuState) => (menu.state === 'open' ? '999px' : '-8px')} rgba(0, 0, 0, 0.1);
  width: 14rem;
  padding-top: 3rem;

  .close {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-right: 1rem;
    min-height: 66px;
  }
`;

const UserIconBox = styled.div`
  display: flex;
  white-space: nowrap;
  align-items: center;
  svg {
    position: relative;
    width: 1.5rem;
    height: auto;
    margin-right: 0.25rem;
  }
  a {
    text-decoration: none;
  }
`;

const HeaderContainer = styled.div`
  position: relative;
`;

const Actions = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  height: 66px;
  display: flex;
  align-items: center;

  > .mobile {
    margin-right: 1rem;
  }

  > .desktop {
    display: none;
    margin-right: 1rem;
  }

  @media (min-width: 768px) {
    .mobile {
      display: none;
    }
    .desktop {
      display: flex;
    }
  }
`;
