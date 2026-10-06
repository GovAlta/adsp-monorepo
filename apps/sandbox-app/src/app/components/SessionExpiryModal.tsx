import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';
import { AppDispatch, getKeycloakExpiry, refreshSession } from '../state';

// Same thresholds as tenant management web app: warn with 4 minutes left, sign out with 1 minute left.
const WARNING_SECONDS = 4 * 60;
const SIGN_OUT_SECONDS = 60;
const TICK_MS = 1000;

// Computed from the expiry time on every tick, so throttled timers in background tabs stay accurate.
const secondsUntilExpiry = (): number | null => {
  const expiry = getKeycloakExpiry();
  return expiry ? Math.ceil(expiry - Date.now() / 1000) : null;
};

interface SessionExpiryModalProps {
  onSignOut: () => void;
}

export const SessionExpiryModal = ({ onSignOut }: SessionExpiryModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [secondsLeft, setSecondsLeft] = useState(secondsUntilExpiry);
  const signingOut = useRef(false);
  const expired = secondsLeft !== null && secondsLeft <= SIGN_OUT_SECONDS;
  const open = secondsLeft !== null && secondsLeft <= WARNING_SECONDS && !expired;

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(secondsUntilExpiry()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (expired && !signingOut.current) {
      signingOut.current = true;
      onSignOut();
    }
  }, [expired, onSignOut]);

  return (
    <GoabModal
      open={open}
      heading="Your session is about to end"
      testId="session-expiry-modal"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" size="compact" testId="session-sign-out" onClick={onSignOut}>
            Sign out
          </GoabButton>
          <GoabButton size="compact" testId="session-continue" onClick={() => dispatch(refreshSession())}>
            Stay signed in
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <p>
        You will be signed out in <b data-testid="session-countdown">{open ? secondsLeft - SIGN_OUT_SECONDS : 0}</b>{' '}
        seconds. Any unsaved changes will be lost.
      </p>
    </GoabModal>
  );
};
