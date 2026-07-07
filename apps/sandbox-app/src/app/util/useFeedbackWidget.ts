import { useEffect } from 'react';
import { DEFAULT_TENANT } from './feedbackUtils';

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

export const useFeedbackWidget = () => {
  useEffect(() => {
    if (globalThis.adspFeedback !== undefined) {
      globalThis.adspFeedback.initialize({
        tenant: DEFAULT_TENANT,
        getContext: () => getFeedbackContext(),
      });
    }
    updateWidgetVisibility(true);
    // Destructor function to clean up
    return () => {
      updateWidgetVisibility(false);
    };
  }, []);
};
