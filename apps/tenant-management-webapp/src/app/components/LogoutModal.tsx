import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { GoAModal, GoAModalContent, GoAModalTitle, GoAModalActions } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import { RootState } from '@store/index';

export const LogoutModal = (): JSX.Element => {
  const { isExpired } = useSelector((state: RootState) => ({
    isExpired: state.session?.isExpired,
  }));

  // eslint-disable-next-line
  useEffect(() => {}, [isExpired]);

  return (
    <GoAModal isOpen={isExpired === true} testId="tenant-logout-notice-modal">
      <GoAModalTitle>Session expired</GoAModalTitle>
      <GoAModalContent>
        You were logged out of the system. If you wish to continue, please login again. Otherwise, close the tab or
        window.
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          onClick={() => {
            const tenantRealm = localStorage.getItem('realm');
            const idpFromUrl = localStorage.getItem('idpFromUrl');
            localStorage.removeItem('realm');
            if (idpFromUrl === null || idpFromUrl === 'core') {
              window.location.replace(`${tenantRealm}/login`);
            } else {
              window.location.replace(`${tenantRealm}/login?kc_idp_hint=${idpFromUrl}`);
            }
          }}
        >
          Login again
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
