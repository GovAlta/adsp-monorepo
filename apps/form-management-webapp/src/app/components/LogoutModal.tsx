import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components';
import { RootState } from '@store/index';
import { TenantLogout } from '@store/tenant/actions';
import { clearInterval, setInterval } from 'worker-timers';
import { UpdateAccessToken } from '@store/tenant/actions';
import { authInstance } from '@lib/keycloak';

export const LogoutModal = (): JSX.Element => {
  const [open, setOpen] = useState<boolean>(false);
  const [countdownTime, setCountdownTime] = useState<number>(120);

  const dispatch = useDispatch();
  const ref = useRef(null);
  const countDownRef = useRef(null);

  useEffect(() => {
    // windows.worker is added to avoid affecting the spec files
    if (window?.Worker) {
      ref.current = setInterval(() => {
        if (authInstance) {
          const expiry = authInstance.getExpiryTime();
          if (expiry) {
            const expiryInSecs = Math.ceil(expiry - Date.now() / 1000);
            if (expiryInSecs <= 0) {
              dispatch(TenantLogout());
              return;
            }
            if (expiryInSecs <= 4 * 60 && expiryInSecs > 60 && open === false) {
              setOpen(true);
            }

            if (expiryInSecs <= 60) {
              dispatch(TenantLogout());
            }
          }
        }
      }, 1000 * 60);
    }

    return () => {
      if (ref.current) {
        clearInterval(ref.current);
      }
    };
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      const expiry = authInstance.getExpiryTime();
      const expiryInSecs = Math.ceil(expiry - Date.now() / 1000);
      countDownRef.current = setInterval(() => {
        setCountdownTime((time) => {
          if (time === 0) {
            dispatch(TenantLogout());
            return 0;
          }

          if (time > 0) {
            return time - 1;
          }
        });
      }, 1000);
    } else {
      if (countDownRef.current) {
        clearInterval(countDownRef.current);
        countDownRef.current = null;
      }
    }
  }, [open, dispatch]);

  return (
    <GoAModal
      open={open}
      testId="tenant-logout-notice-modal"
      heading="Session expired"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="session-continue-button"
            onClick={() => {
              dispatch(UpdateAccessToken());
              setCountdownTime(120);
              setOpen(false);
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
