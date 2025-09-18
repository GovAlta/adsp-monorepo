import React, { useState } from 'react';
import { GoAHeader } from '@abgov/react-components-old';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import MenuIcon from '@icons/menu-outline.svg';
import CloseIcon from '@icons/close-outline.svg';
import { GoAButton } from '@abgov/react-components';
import { TenantAdminLogin, TenantLogout } from '@store/tenant/actions';
import { getIdpHint } from '@lib/keycloak';
import { selectUserName, selectUserEmail, selectIsAuthenticated } from '@store/session/selectors';

interface HeaderMenuProps {
  hasLoginLink: boolean;
  admin: boolean;
}
interface HeaderProps {
  serviceName?: string;
  hasLoginLink?: boolean;
  admin?: boolean;
}
const SignoutBadgeWrapper = styled.div`
  display: inline-block;
  position: relative;
`;

const ActionsMenu = (props: HeaderMenuProps): JSX.Element => {
  const authenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();
  const [menuState, setMenuState] = useState<MenuState>({ state: 'closed' });
  const userName = useSelector(selectUserName);
  const userEmail = useSelector(selectUserEmail);
  const displayName = userName || userEmail || '';

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
          </SidebarWrapper>
        </SidebarController>
      </div>

      {props.hasLoginLink ? (
        <div className="desktop">
          {/* For admin pages, only logout is required */}
          {(authenticated || props.admin) && (
            <div>
              {displayName && <SignoutBadgeWrapper>{displayName}</SignoutBadgeWrapper>}
              <GoAButton type="tertiary" testId="sign-out-btn" onClick={() => dispatch(TenantLogout())}>
                Sign out
              </GoAButton>
            </div>
          )}

          {!authenticated && !props.admin && (
            <GoAButton
              type="tertiary"
              testId="sign-ing-btn"
              onClick={() => {
                const idpHint = getIdpHint();
                dispatch(TenantAdminLogin(idpHint));
              }}
            >
              Sign In
            </GoAButton>
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

const HeaderContainer = styled.div`
  position: relative;
  border-bottom: 1px solid #dcdcdc;
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

export const NoPaddingH2 = styled.h2`
  margin-top: var(--goa-space-s) !important;
  padding-left: 0rem !important;
`;
