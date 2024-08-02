import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import feedback from './feedback.page';
import commonlib from '../common/common-library';
import common from '../common/common.page';

const feedbackObj = new feedback();
const commonObj = new common();

Then('the user views {string} section on feedback overview page', function (sectionName) {
  feedbackObj.feedbackOverviewTab().should('exist');
  switch (sectionName) {
    case 'description':
      feedbackObj
        .feedbackOverviewDescription()
        .invoke('text')
        .should(
          'contain',
          'The feedback service provides a backend API and a frontend widget for applications to accept feedback from users. Feedback comments are anonymized using the PII service and records are stored and available from the Value service API.'
        );
      break;
    case 'Sites':
      feedbackObj
        .feedbackOverviewSitesContent()
        .invoke('text')
        .should(
          'contain',
          'Configure the sites against which feedback is allowed. Enable anonymous feedback for a site so that unauthenticated users can send feedback directly to the API, but note that this could reduce the quality of feedback.'
        );
      break;
    case 'Feedback widget':
      feedbackObj
        .feedbackOverviewFeedbackWidgetContent()
        .invoke('text')
        .should('contain', 'Reference the feedback widget script in <head> to set the adspFeedback global variable.');
      feedbackObj.feedbackOverviewFeedbackWidgetContent().invoke('text').should('contain', 'adspFeedback.initialize');
      break;
    default:
      expect(sectionName).to.be.oneOf(['description', 'Sites', 'Feedback widget']);
  }
});
