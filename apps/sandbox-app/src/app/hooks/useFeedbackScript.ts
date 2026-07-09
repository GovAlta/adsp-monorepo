import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { environmentSelector } from '../state';
import { DEFAULT_TENANT, getFeedbackContext } from './useFeedbackWidget';

export const useFeedbackScript = (tenantName?: string) => {
  const environment = useSelector(environmentSelector);

  useEffect(() => {
    const src = environment.feedback?.url;
    if (!src) return;

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    script.onload = () => {
      globalThis.adspFeedback?.initialize({
        tenant: tenantName ?? DEFAULT_TENANT,
        getContext: () => getFeedbackContext(),
      });
    };
    document.head.appendChild(script);
  }, [environment.feedback?.url, tenantName]);
};
