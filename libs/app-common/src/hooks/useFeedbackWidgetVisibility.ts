import { useEffect } from 'react';

const FEEDBACK_BADGE_SELECTOR = '.adsp-fb-badge';

function setFeedbackWidgetVisibility(show: boolean) {
  const badges = document.querySelectorAll<HTMLElement>(FEEDBACK_BADGE_SELECTOR);
  badges.forEach((badge) => badge.setAttribute('data-show', show ? 'true' : 'false'));
}

export const useFeedbackWidgetVisibility = (show: boolean) => {
  useEffect(() => {
    setFeedbackWidgetVisibility(show);

    return () => {
      setFeedbackWidgetVisibility(!show);
    };
  }, [show]);
};
