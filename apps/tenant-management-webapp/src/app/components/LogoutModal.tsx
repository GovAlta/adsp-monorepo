import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components-new';
import { RootState } from '@store/index';
import { TenantLogout } from '@store/tenant/actions';
import { clearInterval, setInterval } from 'worker-timers';
import { UpdateAccessToken } from '@store/tenant/actions';

export const LogoutModal = (): JSX.Element => {
  const { isExpired } = useSelector((state: RootState) => ({
    isExpired: state.session?.isExpired,
  }));
  const [countdownTime, setCountdownTime] = useState(120);
  const dispatch = useDispatch();
  const ref = useRef(null);

  const { refreshTokenExp } = useSelector((state: RootState) => ({
    refreshTokenExp: state.session?.credentials?.refreshTokenExp,
  }));

  // If less than 132 seconde left, we will force the user to logout directly.
  const canRefreshToken = refreshTokenExp ? refreshTokenExp - Date.now() / 1000 - 2.2 * 60 > 0 : undefined;

  useEffect(() => {
    if (canRefreshToken === false) {
      dispatch(TenantLogout());
    }
  }, [canRefreshToken]);

  useEffect(() => {
    if (isExpired === true) {
      ref.current = setInterval(() => {
        setCountdownTime((time) => {
          if (time === 0) {
            if (isExpired === true) {
              dispatch(TenantLogout());
            }
            clearInterval(ref.current);
            return 0;
          } else return time - 1;
        });
      }, 1000);
    } else {
      if (ref.current !== null) {
        clearInterval(ref.current);
      }
    }
  }, [dispatch, isExpired]);

  return (
    <GoAModal
      open={isExpired === true}
      testId="tenant-logout-notice-modal"
      heading="Session expired"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="session-continue-button"
            onClick={() => {
              dispatch(UpdateAccessToken());
            }}
          >
            Continue
          </GoAButton>
          <GoAButton
            testId="session-again-button"
            type="secondary"
            onClick={() => {
              dispatch(TenantLogout());
            }}
          >
            Logout
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <p>
        Your current login session will be expired in <b>{`${countdownTime}`}</b> seconds. Any unsaved changes will be
        lost.
      </p>
    </GoAModal>
  );
};
