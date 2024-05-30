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
  const { refreshTokenExp } = useSelector((state: RootState) => ({
    refreshTokenExp: state.session?.credentials?.refreshTokenExp,
  }));
  const [countdownTime, setCountdownTime] = useState(Math.ceil(refreshTokenExp - Date.now() / 1000));
  const dispatch = useDispatch();
  const ref = useRef(null);

  useEffect(() => {
    if (isExpired === true) {
      ref.current = setInterval(() => {
        setCountdownTime(() => {
          const timeLeft = Math.ceil(refreshTokenExp - Date.now() / 1000);
          if (timeLeft <= 1) {
            clearInterval(ref.current);
            dispatch(TenantLogout());
          }

          return timeLeft;
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
