import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AppDispatch, logoutUser, renewSession, sessionExpirySelector, tenantSelector } from '../state';

const SecondsSpan = styled.span`
  font-weight: bold;
`;

export const SessionExpiryModal = () => {
  const dispatch = useDispatch<AppDispatch>();

  const location = useLocation();
  const tenant = useSelector(tenantSelector);
  const { showAlert, secondsTilExpiry } = useSelector(sessionExpirySelector);

  const [seconds, setSeconds] = useState(120);
  useEffect(() => {
    // Set the interval to count down only if we're showing the modal.
    if (showAlert) {
      setSeconds(secondsTilExpiry);
      const interval = setInterval(
        () =>
          setSeconds((count) => {
            const next = count - 1;

            // Stop if we're at 0.
            if (next < 1) {
              clearInterval(interval);
            }
            return next;
          }),
        1000
      );
      return () => clearInterval(interval);
    }
  }, [setSeconds, secondsTilExpiry, showAlert]);

  return (
    showAlert && (
      <GoabModal heading="Continue working?" open={showAlert}>
        {seconds > 0 ? (
          <div>
            Your session will expire in <SecondsSpan>{seconds}</SecondsSpan> seconds. Do you want to continue working?
          </div>
        ) : (
          <div>Your session has expired. Please logout, then sign in again if you would like to continue working.</div>
        )}
        <GoabButtonGroup alignment="end" mt="l">
          <GoabButton
            type={seconds > 0 ? 'secondary' : 'primary'}
            onClick={() => dispatch(logoutUser({ tenant, from: `${location.pathname}?logout=true` }))}
          >
            Logout
          </GoabButton>
          {seconds > 0 && (
            <GoabButton type="primary" onClick={() => dispatch(renewSession())}>
              Continue working
            </GoabButton>
          )}
        </GoabButtonGroup>
      </GoabModal>
    )
  );
};
