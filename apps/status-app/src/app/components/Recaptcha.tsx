import { recaptchaScriptLoaded } from '@store/config/actions';
import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch } from 'react-redux';

interface RecaptchaProps {
  siteKey: string;
}

export const Recaptcha: FunctionComponent<RecaptchaProps> = ({ siteKey }) => {
  const elementId = 'recaptcha-script';
  const dispatch = useDispatch();

  useEffect(() => {
    const element = document.getElementById(elementId);
    if (siteKey && !element) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.id = elementId;
      script.onload = () => {
        dispatch(recaptchaScriptLoaded());
      };

      document.body.appendChild(script);
    }
    return () => {
      const element = document.getElementById(elementId);
      if (element) {
        element.remove();
      }
    };
  }, [siteKey, dispatch]);

  return null;
};

export default Recaptcha;
