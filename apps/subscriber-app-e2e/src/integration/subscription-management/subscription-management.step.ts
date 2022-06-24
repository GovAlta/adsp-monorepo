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

And('the user views the subscription of {string} and its description', function (subscriptionName) {
  subscriptionManagementObj.subscriptionName(subscriptionName).should('exist');
  subscriptionManagementObj.subscriptionDesc(subscriptionName).invoke('text').should('not.be.empty');
});

And('the user views the support link for the scription of {string}', function (subscriptionName) {
  subscriptionManagementObj
    .contactSupportToUnsbuscribe(subscriptionName)
    .invoke('attr', 'href')
    .should('eq', '/subscriptions/' + Cypress.env('realm') + '#contactSupport');
  subscriptionManagementObj.contactSupportCalloutContent().should('exist');
});

When('the user clicks edit contact information button', function () {
  subscriptionManagementObj.editContactInformation().click();
});

And('the user enters an invalid phone number in contact information', function () {
  subscriptionManagementObj.phoneNumberInput().clear().type('123');
});

And('the user clicks Save button in contact information', function () {
  subscriptionManagementObj.contactInformationSaveBtn().click();
});

And('the user views an error message for the invalid phone number in contact information', function () {
  subscriptionManagementObj.phoneNumberErrorMsg().should('contain', 'You must enter a valid phone number.');
});

And('the user removes phone number value in contact information', function () {
  subscriptionManagementObj.phoneNumberInput().clear();
});

When('the user selects {string} as the preferred channel in contact information', function (selection) {
  subscriptionManagementObj.preferredNotificationChannelSelection(selection).click({ force: true });
});

Then('the user views an error messsage for missing phone number', function () {
  subscriptionManagementObj
    .phoneNumberErrorMsg()
    .should('contain', 'SMS is set as the preferred channel. A valid SMS number is required.');
});

When('the user removes email value in contact information', function () {
  subscriptionManagementObj.emailInput().clear();
});

Then('the user views an error messsage for missing email', function () {
  subscriptionManagementObj.emailErrorMsg().should('contain', 'You must enter a valid email.');
});

When(
  'the user enters {string} as email, {string} as phone number and {string} as preferred channel',
  function (email, phone, channel) {
    subscriptionManagementObj.emailInput().clear().type(email);
    if (phone == 'EMPTY') {
      subscriptionManagementObj.phoneNumberInput().clear();
    } else {
      subscriptionManagementObj.phoneNumberInput().clear().type(phone);
    }
    subscriptionManagementObj.preferredNotificationChannelSelection(channel).click({ force: true });
  }
);

Then('the user views a callout message of {string}', function (message) {
  cy.wait(1000);
  subscriptionManagementObj.calloutMessage().invoke('text').should('contain', message);
});

And('the user views contact information of {string}, {string} and {string}', function (email, phone, channel) {
  subscriptionManagementObj.emailDisplay().invoke('text').should('contain', email);
  if (phone == 'EMPTY') {
    subscriptionManagementObj.phoneNumberInput().should('not.exist');
  } else {
    subscriptionManagementObj.phoneNumberDisplay().invoke('text').should('contain', phone);
  }
  subscriptionManagementObj.preferredNotificationChannelDisplay().should('have.value', channel);
});
