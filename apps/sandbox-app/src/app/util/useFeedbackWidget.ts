import { useEffect } from 'react';
export const getAdspFeedbackContext = (id?: string) => {
  const condoTribunalSite = `https://adsp-dev.gov.ab.ca`;
  const condoTribunalView = document.location.pathname;

  return Promise.resolve({
    site: condoTribunalSite,
    view: condoTribunalView,
    correlationId: id ?? '',
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

//Use this to display the ADSP feedback widget without needing certain constraints
export const useAdspFeedbackWidget = () => {
  useEffect(() => {
    if (globalThis.adspFeedback !== undefined) {
      globalThis.adspFeedback.initialize({
        tenant: 'autotest',
        getContext: () => getAdspFeedbackContext('test'),
      });
      updateWidgetVisibility(true);
    }
    // Destructor function to clean up
    return () => {
      updateWidgetVisibility(false);
    };
  }, []);
};
