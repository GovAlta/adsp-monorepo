import { FunctionComponent, useEffect } from 'react';

interface RecaptchaProps {
  siteKey: string;
  onLoad?: () => void;
}

export const Recaptcha: FunctionComponent<RecaptchaProps> = ({ siteKey, onLoad }) => {
  const elementId = 'recaptcha-script';

  useEffect(() => {
    const element = document.getElementById(elementId);
    if (siteKey && !element) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.id = elementId;
      if (onLoad) {
        script.onload = () => onLoad();
      }

      document.body.appendChild(script);
    }
  });

  return null;
};

export default Recaptcha;
