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
  const dispatch = useDispatch();

  // eslint-disable-next-line
  useEffect(() => {}, [isExpired]);

  return (
    <GoAModal isOpen={isExpired === true} testId="tenant-logout-notice-modal">
      <GoAModalTitle>Session expired</GoAModalTitle>
      <GoAModalContent>Your session has expired. We are going to logout.</GoAModalContent>
      <GoAModalActions>
        <GoAButton
          onClick={() => {
            dispatch(TenantLogout());
          }}
        >
          Ok
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
