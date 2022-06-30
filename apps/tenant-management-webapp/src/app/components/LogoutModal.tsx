import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { TenantLogout } from '@store/tenant/actions';
import { GoAModal, GoAModalContent, GoAModalTitle, GoAModalActions } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';

import { RootState } from '@store/index';

export const LogoutModal = (): JSX.Element => {
  const { isExpired } = useSelector((state: RootState) => ({
    isExpired: state.session?.isExpired,
  }));
  const autoLogoutTimeInSec = 10;
  const dispatch = useDispatch();
  const [count, setCount] = useState(autoLogoutTimeInSec);

  useEffect(() => {
    if (count > 0 && isExpired === true) {
      const logoutTimer = setInterval(() => {
        setCount(count - 1);
      }, 1000);

      return () => {
        clearInterval(logoutTimer);
      };
    } else {
      dispatch(TenantLogout());
    }
  }, [isExpired, count]);

  const timeUnit = count <= 1 ? `second` : `seconds`;

  return (
    <GoAModal isOpen={isExpired === true && count > 0} testId="tenant-logout-notice-modal">
      <GoAModalTitle>Session expired</GoAModalTitle>
      <GoAModalContent>You session has expired. You will log out in {`${count} ${timeUnit}`} .</GoAModalContent>
      <GoAModalActions>
        <GoAButton
          onClick={() => {
            dispatch(TenantLogout());
          }}
        >
          Logout
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
