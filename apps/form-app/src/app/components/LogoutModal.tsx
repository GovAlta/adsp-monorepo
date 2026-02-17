import React, { useEffect, useState, useRef, JSX } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoabButton, GoabModal, GoabButtonGroup } from '@abgov/react-components';
import { clearInterval, setInterval } from 'worker-timers';
import { getKeycloakExpiry } from '../state';
import { logoutUser, tenantSelector, AppDispatch, getAccessToken } from '../state';
import { useLocation } from 'react-router-dom';

export const LogoutModal = (): JSX.Element => {
  const [open, setOpen] = useState<boolean>(false);
  const [countdownTime, setCountdownTime] = useState<number>(120);
  const location = useLocation();

  const dispatch = useDispatch<AppDispatch>();
  const ref = useRef(null);
  const countDownRef = useRef(null);
  const openRef = useRef(open);
  const tenant = useSelector(tenantSelector);

  // Keep ref synced with state so interval callbacks can read the latest value
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    // windows.worker is added to avoid affecting the spec files
    if (window?.Worker) {
      ref.current = setInterval(() => {
        const expiry = getKeycloakExpiry();
        const expiryInSecs = Math.ceil(expiry - Date.now() / 1000);
        if (expiryInSecs <= 0) {
          dispatch(logoutUser({ tenant, from: `${location.pathname}` }));
        }

        // Use ref to avoid stale closure - state value would be captured at interval creation time
        if (expiryInSecs <= 4 * 60 && expiryInSecs > 60 && openRef.current === false) {
          setOpen(true);
        }
      }, 1000 * 60);
    }

    return () => {
      if (ref.current) {
        clearInterval(ref.current);
      }
    };
  }, [dispatch, tenant, location.pathname]);

  useEffect(() => {
    if (open) {
      const expiry = getKeycloakExpiry();
      const expiryInSecs = Math.ceil(expiry - Date.now() / 1000);
      countDownRef.current = setInterval(() => {
        setCountdownTime((time) => {
          if (time === 0) {
            dispatch(logoutUser({ tenant, from: `${location.pathname}` }));
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
  }, [tenant, open, dispatch]);

  return (
    <GoabModal
      open={open}
      testId="tenant-logout-notice-modal"
      heading="Session expired"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            testId="session-continue-button"
            onClick={() => {
              getAccessToken();
              setCountdownTime(120);
              setOpen(false);
            }}
          >
            Continue
          </GoabButton>
          <GoabButton
            testId="session-again-button"
            type="secondary"
            onClick={() => {
              dispatch(logoutUser({ tenant, from: `${location.pathname}` }));
            }}
          >
            Logout
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <p>
        Your current login session will be expired in <b>{`${countdownTime}`}</b> seconds. Any unsaved changes will be
        lost.
      </p>
    </GoabModal>
  );
};
