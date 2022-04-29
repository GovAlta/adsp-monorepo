import { When, Then, And } from 'cypress-cucumber-preprocessor/steps';
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

When('an authenticated user is in the subscriber app', function () {
  cy.visit('/' + Cypress.env('realm') + '/login?kc_idp_hint=');
  // Enter user name and password and click log in button
  subscriptionManagementObj.usernameEmailField().type(Cypress.env('email'));
  subscriptionManagementObj.passwordField().type(Cypress.env('password'));
  subscriptionManagementObj.loginButton().click();
  cy.wait(5000); // Wait all the redirects to settle down
});

Then('the user views subscription management page', function () {
  subscriptionManagementObj.serviceName().invoke('text').should('contain', 'Subscription management');
});

And('the user views the user contact information', function () {
  subscriptionManagementObj.contactInformationEmail().invoke('text').should('not.be.null');
});

And('the user views the subscription of {string}', function (subscriptionName) {
  let subscriptionCount = 0;
  subscriptionManagementObj.subscriptionNames().each((element) => {
    cy.wrap(element)
      .invoke('text')
      .then((subscriptionNameElementText) => {
        if (subscriptionNameElementText == subscriptionName) {
          subscriptionCount = subscriptionCount + 1;
        }
      })
      .then(() => {
        expect(subscriptionCount).equals(1);
      });
  });
});

And('the user views the support link for the scription of {string}', function (subscriptionName) {
  subscriptionManagementObj
    .contactSupportToUnsbuscribe(subscriptionName)
    .invoke('attr', 'href')
    .should('eq', '/subscriptions/' + Cypress.env('realm') + '#contactSupport');
  subscriptionManagementObj.contactSupportCalloutContent().should('exist');
});
