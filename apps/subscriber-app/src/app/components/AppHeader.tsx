import React, { useState } from 'react';
import { GoAHeader } from '@abgov/react-components';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { RootState } from '@store/index';
// import MenuIcon from '@icons/menu-outline.svg';
// import CloseIcon from '@icons/close-outline.svg';
// import { ReactComponent as UserIcon } from '@icons/person-circle-outline.svg';
import { TenantLogout } from '@store/tenant/actions';
import '@abgov/core-css/src/lib/styles/v2/colors.scss';

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

  return (
    <Actions>
      {props.hasLoginLink ? (
        <div className="desktop">
          {/* For admin pages, only logout is required */}
          {(authenticated === true || props.admin) && (
            <UserIconBox>
              {/* <UserIcon /> */}
              <Link to={''} onClick={() => dispatch(TenantLogout())}>
                Sign out
              </Link>
            </UserIconBox>
          )}
        </div>
      ) : null}
    </Actions>
  );
};

function AppHeader({ serviceName = '', hasLoginLink = true, admin = false }: HeaderProps): JSX.Element {
  return (
    <HeaderContainer>
      <GoAHeader serviceHome="/" serviceLevel="beta" serviceName={serviceName}>
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
  border-bottom: 1px solid var(--color-gray-200);
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
