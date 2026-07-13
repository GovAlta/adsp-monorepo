import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { environmentSelector } from '../state';
import { getFeedbackContext } from './useFeedbackWidget';

export const useInitializeFeedbackScript = (tenantName?: string) => {
  const environment = useSelector(environmentSelector);

  useEffect(() => {
    const src = environment.feedback?.url;
    if (!src) return;

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) return;

    // clean-code-ignore: 2.18
    // Updating the DOM script tag with feedback url based on the environment we are on.
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    script.onload = () => {
      globalThis.adspFeedback?.initialize({
        tenant: tenantName ?? '',
        getContext: () => getFeedbackContext(),
      });
    };
    // clean-code-ignore: 2.18
    document.head.appendChild(script);
  }, [environment.feedback?.url, tenantName]);
};
