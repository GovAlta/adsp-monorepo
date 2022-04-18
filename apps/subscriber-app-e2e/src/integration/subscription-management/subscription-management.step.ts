import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import SubscriptionManagementPage from './subscription-management.page';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

const subscriptionManagementObj = new SubscriptionManagementPage();

When('a user goes to subscription management overview site', function () {
  cy.visit('/');
  cy.wait(2000); // Wait all the redirects to settle down
});

Then('the user views the overview page of subscription management', function () {
  subscriptionManagementObj.subscriptionManagementOverviewHeader().should('exist');
});

Then('no critical or serious accessibility issues on {string} page', function (pageName) {
  injectAxe();
  // check all accessibility issues and generate a report without failing the step.
  cy.checkA11y(
    null!,
    {},
    (violations) => {
      htmlReport(violations, true, 'public service status page' + '-all');
    },
    true
  );
  // check critical and serious accessibility issues and generate a report. Fail the step if there are any.
  cy.checkA11y(null!, { includedImpacts: ['critical', 'serious'] }, (violations) => {
    htmlReport(violations, true, pageName + '-critical&serious');
  });
});
