import React, { useContext, useState } from 'react';
import { GoaHeader } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RootState } from '@store/index';
import AuthContext from '@lib/authContext';
import Sidebar from '@components/tenantManagement/sidebar';
import { ReactComponent as MenuIcon } from '@icons/menu-outline.svg';
import { ReactComponent as CloseIcon } from '@icons/close-outline.svg';
import { ReactComponent as UserIcon } from '@icons/user-login.svg';

import './header.css';
interface HeaderMenuProps {
  hasLoginLink: boolean;
}

const ActionsMenu = (props: HeaderMenuProps) => {
  const authenticated = useSelector((state: RootState) => state.session.authenticated);
  const authCtx = useContext(AuthContext);

  const [menuState, setMenuState] = useState<MenuState>({ state: 'closed' });

  function toggleMenu() {
    setMenuState({ state: menuState.state === 'closed' ? 'open' : 'closed' });
  }
  return (
    <Actions>
      <section className="mobile">
        <div onClick={toggleMenu}>
          <MenuIcon width="24" />
          <SidebarWrapper state={menuState.state}>
            <div className="close">
              <CloseIcon width="24" />
            </div>
            <Sidebar type="mobile" />
          </SidebarWrapper>
        </div>
      </section>

      {props.hasLoginLink ? (
        <section className="desktop">
          {authenticated ? (
            <div>
              <UserIcon className={'logout-icon'} />
              <a className={'header-link'} onClick={() => authCtx.signOut()}>
                Sign Out
              </a>
            </div>
          ) : (
            <a className={'header-link'} onClick={() => authCtx.signIn('/')}>
              Sign In
            </a>
          )}
        </section>
      ) : null}
    </Actions>
  );
};

function AppHeader({ serviceName = '', hasLoginLink = true }) {
  return (
    <HeaderContainer>
      <GoaHeader serviceHome="/" serviceLevel="alpha" serviceName={serviceName} />
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
