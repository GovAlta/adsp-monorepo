import { useEffect } from 'react';

export const handleFeedbackClick = (event: MouseEvent) => {
  event.preventDefault();

  if (window.adspFeedback && window.adspFeedback.openFeedbackForm) {
    window.adspFeedback.openFeedbackForm();
  } else {
    console.error('adspFeedback is not defined or openFeedbackForm is missing.');
  }
};

export const useFeedbackLinkHandler = () => {
  useEffect(() => {
    const shadowHost = document.querySelector('goa-microsite-header');
    if (shadowHost && shadowHost.shadowRoot) {
      const shadowRoot = shadowHost.shadowRoot;
      const feedbackLink = shadowRoot.querySelector('[href="#"]');
      if (feedbackLink) {
        feedbackLink.addEventListener('click', handleFeedbackClick);
        return () => feedbackLink.removeEventListener('click', handleFeedbackClick);
      }
    }
  }, []);
};
