type FeedbackConfig = {
  async: boolean;
  src: string;
};

function addScripts(feedbackConfig: FeedbackConfig) {
  const feedbackscript = document.createElement('script');
  feedbackscript.async = feedbackConfig.async;
  feedbackscript.src = feedbackConfig.src;

  document.head.appendChild(feedbackscript);
}

export function isDEV(): boolean {
  const url = window.location.href;

  if (url.includes('localhost') || !url.includes('adsp-apps-dev')) {
    return true;
  }

  return false;
}

export function isUAT(): boolean {
  const url = window.location.href;

  if (url.includes('adsp-apps-uat')) {
    return true;
  }

  return false;
}

function loadScripts() {
  if (isUAT() && !isDEV()) {
    addScripts({
      async: true,
      src: 'https://feedback-service.adsp-uat.alberta.ca/feedback/v1/script/adspFeedback.js',
    });
  } else if (isDEV()) {
    addScripts({
      async: true,
      src: 'https://feedback-service.adsp-dev.alberta.ca/feedback/v1/script/adspFeedback.js',
    });
  } else {
    //Production feedback script url
    addScripts({
      async: true,
      src: 'https://feedback-service.adsp.alberta.ca/feedback/v1/script/adspFeedback.js',
    });
  }
}

export default loadScripts();
