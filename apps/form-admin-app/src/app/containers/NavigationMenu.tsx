import { GoAButton, GoASideMenu, GoASideMenuHeading } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { AppDispatch, definitionSelector, loginUser, logoutUser, tenantSelector, userSelector } from '../state';

const Nav = styled.nav<{ type: 'menu' | 'side' }>`
  @media screen and (max-width: 1023px) {
    display: ${({ type }) => (type === 'side' ? 'none' : 'block')};
  }
  @media screen and (min-width: 1024px) {
    display: ${({ type }) => (type === 'side' ? 'block' : 'none')};
  }

  width: ${({ type }) => type === 'side' && '250px'};
  border-right: 1px solid var(--goa-color-greyscale-200);
  overflow-x: hidden;
`;

interface NavigationMenuProps {
  type: 'menu' | 'side';
}

const UserSpan = styled.span`
  margin-left: var(--goa-space-l);
  margin-right: var(--goa-space-xs);
`;

export const NavigationMenu: FunctionComponent<NavigationMenuProps> = ({ type }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { tenant: tenantName } = useParams();

  const tenant = useSelector(tenantSelector);
  const { initialized: userInitialized, user } = useSelector(userSelector);
  const definition = useSelector(definitionSelector);

  return (
    <>
      {type === 'menu' && userInitialized && (
        <span>
          <UserSpan>{user?.name}</UserSpan>
          {user ? (
            <GoAButton
              mt="s"
              mr="s"
              type="tertiary"
              onClick={() => dispatch(logoutUser({ tenant, from: `${location.pathname}?logout=true` }))}
            >
              Sign out
            </GoAButton>
          ) : (
            <GoAButton
              mt="s"
              mr="s"
              type="tertiary"
              onClick={() => dispatch(loginUser({ tenant, from: location.pathname }))}
            >
              Sign in
            </GoAButton>
          )}
        </span>
      )}
      <Nav type={type}>
        <GoASideMenu data-side-nav={true}>
          <GoASideMenuHeading icon="documents">Form definitions</GoASideMenuHeading>
          <a
            href={`/${tenantName}/definitions`}
            onClick={(e) => {
              navigate('definitions');
              e.preventDefault();
            }}
          >
            Definitions
          </a>
          {definition && (
            <>
              <GoASideMenuHeading icon="document">{definition.name}</GoASideMenuHeading>
              <a
                href={`/${tenantName}/definitions/${definition.id}/overview`}
                onClick={(e) => {
                  navigate(`definitions/${definition.id}/overview`);
                  e.preventDefault();
                }}
              >
                Overview
              </a>
              <a
                href={`/${tenantName}/definitions/${definition.id}/forms`}
                onClick={(e) => {
                  navigate(`definitions/${definition.id}/forms`);
                  e.preventDefault();
                }}
              >
                Forms
              </a>
              {definition.submissionRecords && (
                <a
                  href={`/${tenantName}/definitions/${definition.id}/submissions`}
                  onClick={(e) => {
                    navigate(`definitions/${definition.id}/submissions`);
                    e.preventDefault();
                  }}
                >
                  Submissions
                </a>
              )}
            </>
          )}
        </GoASideMenu>
      </Nav>
    </>
  );
};
