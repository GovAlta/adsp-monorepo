import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { SetSessionExpired, SetSessionWillExpired } from '@store/session/actions';
import { UpdateAccessToken } from '@store/tenant/actions';

export const useTokenExpiryCount = () => {
  const { refreshTokenExp } = useSelector((state: RootState) => ({
    refreshTokenExp: state.session?.credentials?.refreshTokenExp,
  }));
  const dispatch = useDispatch();

  useEffect(() => {
    let logoutCountdown = null;
    if (refreshTokenExp) {
      // Consider as log out if token will be expired within one min.
      const timeDiff = refreshTokenExp - Date.now() / 1000 - 60;
      logoutCountdown = setInterval(() => {
        dispatch(SetSessionExpired(true));
      }, timeDiff * 1000);
    }

    return () => {
      if (logoutCountdown) clearInterval(logoutCountdown);
    };
  }, [refreshTokenExp]);

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
      // start to monitor the user behavior when the token will be expired in 5 mins.
      const timeDiff = refreshTokenExp - Date.now() / 1000 - 60 * 25;
      willExpiredCountdown = setInterval(() => {
        dispatch(SetSessionWillExpired(true));
      }, timeDiff * 1000);
    }

    return () => {
      if (willExpiredCountdown) clearInterval(willExpiredCountdown);
    };
  }, [refreshTokenExp]);

  useEffect(() => {
    // when token will be expired in 5 mins, we start to detect the user action
    if (isWillExpired === true) {
      window.addEventListener('keypress', (event) => {
        dispatch(UpdateAccessToken());
      });
    }
  }, [isWillExpired]);

  return null;
};
