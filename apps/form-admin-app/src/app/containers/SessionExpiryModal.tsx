import { GoAButton, GoAButtonGroup, GoAModal } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, logoutUser, renewSession, sessionExpirySelector, tenantSelector } from '../state';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const SessionExpiryModal = () => {
  const dispatch = useDispatch<AppDispatch>();

  const location = useLocation();
  const tenant = useSelector(tenantSelector);
  const { showAlert, secondsTilExpiry } = useSelector(sessionExpirySelector);

  const [seconds, setSeconds] = useState(secondsTilExpiry);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((count) => count - 1), 1000);
    return () => clearInterval(interval);
  }, [setSeconds]);

  return (
    showAlert && (
      <GoAModal heading="Continue working?" open={showAlert}>
        <p>
          Your session will expiry in <span>{seconds}</span>.
        </p>
        <GoAButtonGroup alignment="end">
          <GoAButton
            type={seconds > 0 ? 'secondary' : 'primary'}
            onClick={() => dispatch(logoutUser({ tenant, from: `${location.pathname}?logout=true` }))}
          >
            Logout
          </GoAButton>
          {seconds > 0 && (
            <GoAButton ml="m" type="primary" onClick={() => dispatch(renewSession())}>
              Continue working
            </GoAButton>
          )}
        </GoAButtonGroup>
      </GoAModal>
    )
  );
};
