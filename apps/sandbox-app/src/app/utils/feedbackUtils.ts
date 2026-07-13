import { useEffect } from 'react';

/**
 * Handles the feedback link click event.
 */
export const handleFeedbackClick = (event: MouseEvent) => {
  event.preventDefault(); // Prevent default link behavior

  if (window.adspFeedback && window.adspFeedback.openFeedbackForm) {
    window.adspFeedback.openFeedbackForm(); // Open the feedback form
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
