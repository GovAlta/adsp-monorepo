import React from 'react';
import { GoAButton, GoAAppHeader, GoAMicrositeHeader } from '@abgov/react-components';
import { LOGIN_TYPES, getOrCreateKeycloakAuth, getIdpHint, authInstance } from '@lib/keycloak';
import { UserInfo, Tenant } from '../../models';
import styles from './AppHeader.module.scss';

interface HeaderMenuProps {
  hasLoginLink: boolean;
  admin: boolean;
  userInfo: UserInfo;
  tenant?: Tenant;
}

interface HeaderProps {
  serviceName?: string;
  hasLoginLink?: boolean;
  admin?: boolean;
  userInfo: UserInfo;
  tenant?: Tenant;
}

const ActionsMenu = ({ hasLoginLink, admin, userInfo, tenant }: HeaderMenuProps): JSX.Element => {
  const { authenticated, displayName } = userInfo;

  return (
    <div className={styles.actions}>
      {hasLoginLink ? (
        <div className="desktop">
          {/* For admin pages, only logout is required */}
          {(authenticated || admin) && (
            <div className="desktop">
              {displayName && <div className={styles.signoutBadgeWrapper}>{displayName}</div>}
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

          {!authenticated && !admin && (
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
    </div>
  );
};

function AppHeader({
  serviceName = '',
  hasLoginLink = true,
  admin = false,
  userInfo,
  tenant,
}: HeaderProps): JSX.Element {
  return (
    <div className={styles.headerContainer}>
      <GoAMicrositeHeader type="alpha"></GoAMicrositeHeader>
      <GoAAppHeader url="/" heading={serviceName}>
        <ActionsMenu hasLoginLink={hasLoginLink} admin={admin} userInfo={userInfo} tenant={tenant} />
      </GoAAppHeader>
    </div>
  );
}

export default AppHeader;

// Export the NoPaddingH2 component for backward compatibility
export const NoPaddingH2: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <h2 className={`${styles.noPaddingH2} ${className}`}>{children}</h2>;
