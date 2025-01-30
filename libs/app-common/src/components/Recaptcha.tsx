import { FunctionComponent, useEffect } from 'react';
import styled from 'styled-components';

interface RecaptchaProps {
  showBranding?: boolean;
  siteKey: string;
  onLoad?: () => void;
}

const RecaptchaBranding = styled.div`
  font-size: var(--goa-font-size-3);
  color: var(--goa-color-text-secondary);
`;

export const Recaptcha: FunctionComponent<RecaptchaProps> = ({ siteKey, showBranding, onLoad }) => {
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

  return (
    showBranding && (
      <RecaptchaBranding>
        This site is protected by reCAPTCHA and the Google{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
          Terms of Service
        </a>{' '}
        apply.
      </RecaptchaBranding>
    )
  );
};

export default Recaptcha;
