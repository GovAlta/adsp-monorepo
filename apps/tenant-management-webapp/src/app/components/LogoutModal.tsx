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
            localStorage.removeItem('realm');
            window.location.replace(`${tenantRealm}/login`);
          }}
        >
          Login again
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
