import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch, isSessionEndingSoon, refreshSession, userActions } from '../state';

const CHECK_INTERVAL_MS = 60_000;

// For long meetings: refreshes without clicks and hides the expiry warning. If Keycloak still ends the
// session, SignIn sends the user through login and back to this page.
export const useKeepSessionAlive = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(userActions.sessionKeepAliveChanged(true));
    const timer = setInterval(() => {
      if (isSessionEndingSoon()) {
        dispatch(refreshSession());
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      dispatch(userActions.sessionKeepAliveChanged(false));
    };
  }, [dispatch]);
};
