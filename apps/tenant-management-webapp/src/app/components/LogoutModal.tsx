import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components-new';
import { RootState } from '@store/index';

export const LogoutModal = (): JSX.Element => {
  const { isExpired } = useSelector((state: RootState) => ({
    isExpired: state.session?.isExpired,
  }));

  // eslint-disable-next-line
  useEffect(() => {}, [isExpired]);

  return (
    <GoAModal
      open={isExpired === true}
      testId="tenant-logout-notice-modal"
      heading="Session expired"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="logout-again-button"
            onClick={() => {
              const tenantRealm = encodeURIComponent(localStorage.getItem('realm'));
              const idpFromUrl = encodeURIComponent(localStorage.getItem('idpFromUrl'));
              localStorage.removeItem('realm');
              if (idpFromUrl === null || idpFromUrl === 'core') {
                const url = `${tenantRealm}/login`;
                window.location.replace(url);
              } else {
                const url = `${tenantRealm}/login?kc_idp_hint=${idpFromUrl}`;
                window.location.replace(url);
              }
            }}
          >
            Login again
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <p>
        You were logged out of the system. If you wish to continue, please login again. Otherwise, close the tab or
        window.
      </p>
    </GoAModal>
  );
};
