// Development scaffold initialization of feedback.
import './main.js';

window.onload = function () {
  // eslint-disable-next-line no-undef
  adspFeedback.initialize({
    tenant: 'autotest',
    apiUrl: 'http://localhost:3342/feedback/v1/feedback',
  });
};
