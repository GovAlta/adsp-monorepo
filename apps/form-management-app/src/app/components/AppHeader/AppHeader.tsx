import React from 'react';
import { GoabButton, GoabAppHeader, GoabMicrositeHeader } from '@abgov/react-components';
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
  tenantName?: string;
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
              <GoabButton
                type="tertiary"
                testId="sign-out-btn"
                onClick={() =>
                  (async () => {
                    try {
                      if (authInstance) {
                        await authInstance.logout();
                      } else {
                        const state = (
                          window as { __APP_STORE__?: { getState?: () => unknown } }
                        ).__APP_STORE__?.getState?.() as
                          | {
                              config?: { keycloakApi?: { url: string; clientId: string; realm?: string } };
                              session?: { realm?: string };
                            }
                          | undefined;
                        const kc = state?.config?.keycloakApi;
                        if (kc) {
                          const realm = state?.session?.realm || kc.realm || 'core';
                          const auth = await getOrCreateKeycloakAuth(
                            { url: kc.url, clientId: kc.clientId, realm },
                            realm
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
              </GoabButton>
            </div>
          )}

          {!authenticated && !admin && (
            <GoabButton
              type="tertiary"
              testId="sign-ing-btn"
              onClick={() => {
                const idpHint = getIdpHint();
                (async () => {
                  try {
                    const state = (
                      window as { __APP_STORE__?: { getState?: () => unknown } }
                    ).__APP_STORE__?.getState?.() as
                      | {
                          config?: { keycloakApi?: { url: string; clientId: string; realm?: string } };
                          session?: { realm?: string };
                        }
                      | undefined;
                    const kc = state?.config?.keycloakApi;
                    if (kc) {
                      const realm = state?.session?.realm || kc.realm || 'core';
                      const auth = await getOrCreateKeycloakAuth({ url: kc.url, clientId: kc.clientId, realm }, realm);
                      await auth.loginByCore(LOGIN_TYPES.tenant, getIdpHint());
                    }
                  } catch (e) {
                    console.error(e);
                  }
                })();
              }}
            >
              Sign In
            </GoabButton>
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
  tenantName,
}: HeaderProps): JSX.Element {
  return (
    <div className={styles.headerContainer}>
      <GoabMicrositeHeader type="alpha"></GoabMicrositeHeader>
      <GoabAppHeader url={tenantName ? `/${tenantName}` : '/'} heading={serviceName}>
        <ActionsMenu hasLoginLink={hasLoginLink} admin={admin} userInfo={userInfo} tenant={tenant} />
      </GoabAppHeader>
    </div>
  );
}

export default AppHeader;
