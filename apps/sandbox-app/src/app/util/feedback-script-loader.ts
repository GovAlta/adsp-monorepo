import { environment } from '../../environments/environment';

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

function loadScripts() {
  addScripts({
    async: true,
    src: environment.feedback.url ?? '',
  });
}

export default loadScripts();
