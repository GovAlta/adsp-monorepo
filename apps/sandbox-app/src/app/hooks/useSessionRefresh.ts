import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch, isSessionEndingSoon, refreshSession } from '../state';

// Clicking or typing near the end of the Keycloak session extends it, like tenant management web app.
export const useSessionRefresh = (signedIn: boolean) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!signedIn) {
      return undefined;
    }

    const extendSessionIfEndingSoon = () => {
      if (isSessionEndingSoon()) {
        dispatch(refreshSession());
      }
    };
    window.addEventListener('click', extendSessionIfEndingSoon);
    window.addEventListener('keypress', extendSessionIfEndingSoon);

    return () => {
      window.removeEventListener('click', extendSessionIfEndingSoon);
      window.removeEventListener('keypress', extendSessionIfEndingSoon);
    };
  }, [dispatch, signedIn]);
};
