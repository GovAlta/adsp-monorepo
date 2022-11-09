import React, { useState } from 'react';
import { GoAHeader } from '@abgov/react-components';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { RootState } from '@store/index';
import Sidebar from '@pages/admin/sidebar';
import MenuIcon from '@icons/menu-outline.svg';
import CloseIcon from '@icons/close-outline.svg';
import { ReactComponent as UserIcon } from '@icons/person-circle-outline.svg';
import { TenantAdminLogin, TenantLogout } from '@store/tenant/actions';
import { getIdpHint } from '@lib/keycloak';

interface HeaderMenuProps {
  hasLoginLink: boolean;
  admin: boolean;
}
interface HeaderProps {
  serviceName?: string;
  hasLoginLink?: boolean;
  admin?: boolean;
}
const ActionsMenu = (props: HeaderMenuProps): JSX.Element => {
  const authenticated = useSelector((state: RootState) => state.session.authenticated);
  const dispatch = useDispatch();
  const [menuState, setMenuState] = useState<MenuState>({ state: 'closed' });

  function toggleMenu() {
    setMenuState({ state: menuState.state === 'closed' ? 'open' : 'closed' });
  }

  return (
    <Actions>
      <div className="mobile">
        <SidebarController onClick={toggleMenu}>
          <img src={MenuIcon} width="24" alt="Menu" style={{ position: 'fixed', right: 0 }} />
          <SidebarWrapper state={menuState.state}>
            <div className="close">
              <img src={CloseIcon} width="24" alt="Close" />
            </div>
            <Sidebar type="mobile" />
          </SidebarWrapper>
        </SidebarController>
      </div>

      {props.hasLoginLink ? (
        <div className="desktop">
          {/* For admin pages, only logout is required */}
          {(authenticated === true || props.admin) && (
            <UserIconBox>
              <UserIcon />
              <Link to={''} onClick={() => dispatch(TenantLogout())}>
                Sign out
              </Link>
            </UserIconBox>
          )}

          {!authenticated && !props.admin && (
            <a
              onClick={() => {
                const idpHint = getIdpHint();
                dispatch(TenantAdminLogin(idpHint));
              }}
            >
              Sign In
            </a>
          )}
        </div>
      ) : null}
    </Actions>
  );
};

function AppHeader({ serviceName = '', hasLoginLink = true, admin = false }: HeaderProps): JSX.Element {
  return (
    <HeaderContainer>
      <GoAHeader serviceHome="/" serviceLevel="live" serviceName={serviceName}>
        <ActionsMenu hasLoginLink={hasLoginLink} admin={admin} />
      </GoAHeader>
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
  background-color: var(--color-white);
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
  border-bottom: 10px solid #c8eefa;
`;

const Actions = styled.div`
  display: flex;

  > .desktop {
    display: none;
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
