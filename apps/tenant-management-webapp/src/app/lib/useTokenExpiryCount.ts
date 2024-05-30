import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { SetSessionExpired, SetSessionWillExpired } from '@store/session/actions';
import { UpdateAccessToken } from '@store/tenant/actions';
import { MAX_ALLOWED_IDLE_IN_MINUTE } from '@lib/keycloak';
import { clearInterval, setInterval } from 'worker-timers';

export const useTokenExpiryCount = () => {
  const { refreshTokenExp } = useSelector((state: RootState) => ({
    refreshTokenExp: state.session?.credentials?.refreshTokenExp,
  }));
  const dispatch = useDispatch();

  useEffect(() => {
    let logoutCountdown = null;

    if (refreshTokenExp) {
      // Consider as log out if token will be expired within 2 min.
      const timeDiffInMin = refreshTokenExp - Date.now() / 1000 - 2 * 60;
      logoutCountdown = setInterval(() => {
        dispatch(SetSessionExpired(true));
      }, timeDiffInMin * 1000);
    }

    return () => {
      if (logoutCountdown) clearInterval(logoutCountdown);
    };
  }, [dispatch, refreshTokenExp]);

  return null;
};

export const useTokenWillExpiryCount = () => {
  const { refreshTokenExp } = useSelector((state: RootState) => ({
    refreshTokenExp: state.session?.credentials?.refreshTokenExp,
  }));

  const { isWillExpired } = useSelector((state: RootState) => ({
    isWillExpired: state.session?.isWillExpired,
  }));

  const dispatch = useDispatch();

  useEffect(() => {
    let willExpiredCountdown = null;
    if (refreshTokenExp) {
      // start to monitor the user behavior when the token will be expired in MAX_ALLOWED_IDLE_IN_MINUTE mins.
      const timeDiff = refreshTokenExp - Date.now() / 1000 - 60 * MAX_ALLOWED_IDLE_IN_MINUTE;

      willExpiredCountdown = setInterval(() => {
        dispatch(SetSessionWillExpired(true));
      }, timeDiff * 1000);
    }

    return () => {
      if (willExpiredCountdown) clearInterval(willExpiredCountdown);
    };
  }, [refreshTokenExp, dispatch]);

  useEffect(() => {
    const tokenWillExpireHandler = (_event) => {
      dispatch(UpdateAccessToken());
      dispatch(SetSessionWillExpired(false));
    };

    if (isWillExpired === true) {
      // Extend the refresh token expiry if pre-defined event is detected
      window.addEventListener('keypress', tokenWillExpireHandler);
    }

    return function cleanupListener() {
      window.removeEventListener('keypress', tokenWillExpireHandler);
    };
  }, [dispatch, isWillExpired]);

  return null;
};
