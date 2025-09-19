import React from 'react';
import { GoAHeader } from '@abgov/react-components-old';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { GoAButton } from '@abgov/react-components';
import { LOGIN_TYPES, getOrCreateKeycloakAuth, getIdpHint, authInstance } from '@lib/keycloak';
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
  const userName = useSelector(selectUserName);
  const userEmail = useSelector(selectUserEmail);
  const displayName = userName || userEmail || '';

  return (
    <Actions>
      {props.hasLoginLink ? (
        <div className="desktop">
          {/* For admin pages, only logout is required */}
          {(authenticated || props.admin) && (
            <div className="desktop">
              {displayName && <SignoutBadgeWrapper>{displayName}</SignoutBadgeWrapper>}
              <GoAButton
                type="tertiary"
                testId="sign-out-btn"
                onClick={() =>
                  (async () => {
                    try {
                      if (authInstance) {
                        await authInstance.logout();
                      } else {
                        const state = (window as any).__APP_STORE__?.getState?.();
                        const kc = state?.config?.keycloakApi;
                        if (kc) {
                          const auth = await getOrCreateKeycloakAuth(
                            { url: kc.url, clientId: kc.clientId } as any,
                            state?.session?.realm || kc.realm || 'core'
                          );
                          await auth.logout();
                        }
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  })()
                }
              >
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
                (async () => {
                  try {
                    const state = (window as any).__APP_STORE__?.getState?.();
                    const kc = state?.config?.keycloakApi;
                    if (kc) {
                      const auth = await getOrCreateKeycloakAuth(
                        { url: kc.url, clientId: kc.clientId } as any,
                        state?.session?.realm || kc.realm || 'core'
                      );
                      await auth.loginByCore(LOGIN_TYPES.tenant, getIdpHint());
                    }
                  } catch (e) {
                    console.error(e);
                  }
                })();
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
