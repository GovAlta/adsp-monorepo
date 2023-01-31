import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import React, { useEffect } from 'react';
import { SetSessionExpired } from '@store/session/actions';

export const TokenExpiryCount = (): JSX.Element => {
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

  return <></>;
};
