import { useEffect } from 'react';

export const getFeedbackContext = () => {
  const sandboxSite = `${document.location.protocol}//${document.location.host}`;
  const sandboxView = document.location.pathname;

  return Promise.resolve({
    site: sandboxSite,
    view: sandboxView,
  });
};

const ADSP_FEEDBACK_BADGE_ID = 'adsp-fb-badge';

function updateWidgetVisibility(show: boolean) {
  const feedbackWidgets = document.getElementsByClassName(ADSP_FEEDBACK_BADGE_ID);
  if (feedbackWidgets && feedbackWidgets.length === 1) {
    Array.from(feedbackWidgets).forEach((el) => {
      (el as HTMLElement).setAttribute('data-show', show ? 'true' : 'false');
    });
  }
}

export const resolveFeedbackTenant = (tenantName?: string) => {
  const configuredTenant = tenantName?.trim();
  if (configuredTenant) {
    return configuredTenant;
  }

  const [tenantFromPath] = document.location.pathname.split('/').filter(Boolean);
  return tenantFromPath || '';
};

export const useFeedbackWidget = (tenantName?: string) => {
  useEffect(() => {
    const tenant = resolveFeedbackTenant(tenantName);

    if (globalThis.adspFeedback !== undefined) {
      if (!tenant) {
        updateWidgetVisibility(false);
        return () => {
          updateWidgetVisibility(false);
        };
      }

      globalThis.adspFeedback.initialize({
        tenant,
        getContext: () => getFeedbackContext(),
        designSystemsVersion: '2.0',
      });
    }
    updateWidgetVisibility(true);
    return () => {
      updateWidgetVisibility(false);
    };
  }, [tenantName]);
};
