import { useFeedbackWidgetVisibility } from '@core-services/app-common';
import { useEffect } from 'react';

export const getFeedbackContext = () => {
  const sandboxSite = `${document.location.protocol}//${document.location.host}`;
  const sandboxView = document.location.pathname;

  return Promise.resolve({
    site: sandboxSite,
    view: sandboxView,
  });
};

export const useFeedbackWidget = (tenantName?: string) => {
  useFeedbackWidgetVisibility(true);

  useEffect(() => {
    if (globalThis.adspFeedback !== undefined) {
      globalThis.adspFeedback.initialize({
        tenant: tenantName ?? '',
        getContext: () => getFeedbackContext(),
        designSystemsVersion: '2.0',
      });
    }
  }, [tenantName]);
};
