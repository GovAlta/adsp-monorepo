import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
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
  cy.wait(4000); // Wait all the redirects to settle down
});

When(
  'an authenticated user with {string} and {string} is in the subscriber app',
  function (username: string, password: string) {
    cy.visit('/' + Cypress.env('realm') + '/login?kc_idp_hint=');
    // Enter user name and password and click log in button
    subscriptionManagementObj.usernameEmailField().type(username);
    subscriptionManagementObj.passwordField().type(password);
    subscriptionManagementObj.loginButton().click();
    cy.wait(4000); // Wait all the redirects to settle down
  }
);

Then('the user views subscription management page', function () {
  subscriptionManagementObj.serviceName().invoke('text').should('contain', 'Subscription management');
});

Then('the user views the user contact information', function () {
  subscriptionManagementObj.contactInformationEmail().invoke('text').should('not.be.null');
});

Then('the user views the subscription of {string} and its description', function (subscriptionName) {
  subscriptionManagementObj.subscriptionName(subscriptionName).should('exist');
  subscriptionManagementObj.subscriptionDesc(subscriptionName).invoke('text').should('not.be.empty');
});

Then('the user views the support link for the subscription of {string}', function (subscriptionName) {
  subscriptionManagementObj
    .contactSupportToUnsbuscribe(subscriptionName)
    .invoke('attr', 'href')
    .should('eq', '/subscriptions/' + Cypress.env('realm') + '#contactSupport');
  subscriptionManagementObj.contactSupportCalloutContent().should('exist');
});

When('the user clicks edit contact information button', function () {
  subscriptionManagementObj.editContactInformation().shadow().find('button').click({ force: true });
});

When('the user clicks Save button in contact information', function () {
  subscriptionManagementObj.contactInformationSaveBtn().shadow().find('button').click({ force: true });
});

Then('the user views an error message for the invalid phone number in contact information', function () {
  subscriptionManagementObj
    .phoneNumberFormItemWithError()
    .shadow()
    .find('.error-msg')
    .should('contain', 'Please enter a valid 10 digit phone number');
});

When('the user removes phone number value in contact information', function () {
  subscriptionManagementObj.phoneNumberInput().shadow().find('input').clear({ force: true });
});

When('the user selects {string} as the preferred channel in contact information', function (selection) {
  subscriptionManagementObj
    .preferredNotificationChannelGroup()
    .find('goa-radio-item')
    .shadow()
    .find('input[value="' + selection + '"]')
    .click({ force: true });
});

Then('the user views an error messsage for missing phone number', function () {
  subscriptionManagementObj
    .phoneNumberFormItemWithError()
    .shadow()
    .find('.error-msg')
    .should('contain', 'SMS is set as the preferred channel. A valid SMS number is required.');
});

When('the user removes email value in contact information', function () {
  subscriptionManagementObj.emailInput().shadow().find('input').clear({ force: true });
});

Then('the user views an error messsage for missing email', function () {
  subscriptionManagementObj
    .emailFormItemWithError()
    .shadow()
    .find('.error-msg')
    .should('contain', 'You must enter a valid email.');
});

When(
  'the user enters {string} as email, {string} as phone number and {string} as preferred channel',
  function (email: string, phone: string, channel) {
    subscriptionManagementObj.emailInput().shadow().find('input').clear().type(email, { delay: 50, force: true });
    if (phone == 'EMPTY') {
      subscriptionManagementObj.phoneNumberInput().shadow().find('input').clear({ force: true });
    } else {
      subscriptionManagementObj
        .phoneNumberInput()
        .shadow()
        .find('input')
        .clear()
        .type(phone, { delay: 50, force: true });
    }
    subscriptionManagementObj
      .preferredNotificationChannelGroup()
      .find('goa-radio-item')
      .shadow()
      .find('input[value="' + channel + '"]')
      .click({ force: true });
  }
);

Then('the user views contact information of {string}, {string} and {string}', function (email, phone, channel) {
  subscriptionManagementObj.contactInformationEmail().invoke('text').should('contain', email);
  if (phone == 'EMPTY') {
    subscriptionManagementObj.contactInformationPhoneNumber().invoke('text').should('be.empty');
  } else {
    subscriptionManagementObj.contactInformationPhoneNumber().invoke('text').should('contain', phone);
  }
  subscriptionManagementObj.preferredNotificationPreferredChannelGroup().invoke('attr', 'value').should('eq', channel);
});

Then('the user views the checked {string} icon for {string}', function (channel: string, subscriptionName) {
  switch (channel.toLowerCase()) {
    case 'email':
      subscriptionManagementObj.availableChannel(subscriptionName).get('[data-testid="mail-icon"]').should('exist');
      subscriptionManagementObj.channelCheckedIcon(subscriptionName).should('exist');
      break;
    case 'sms':
      subscriptionManagementObj.availableChannel(subscriptionName).get('[data-testid="sms-icon"]').should('exist');
      subscriptionManagementObj.channelCheckedIcon(subscriptionName).should('exist');
      break;
    case 'bot':
      subscriptionManagementObj.availableChannel(subscriptionName).get('[data-testid="bot-icon"]').should('exist');
      subscriptionManagementObj.channelCheckedIcon(subscriptionName).should('exist');
      break;
    default:
      expect(channel).to.be.oneOf(['sms', 'email', 'bot']);
  }
});

Then('the user views a notification message of {string}', function (message) {
  cy.wait(4000); // Wait for the message to show up
  subscriptionManagementObj.notificationMessage().invoke('text').should('contain', message);
});

When('the user access subscriber app login with the tenant name of {string}', function (tenantName: string) {
  const urlToTenantLogin = Cypress.config().baseUrl + tenantName + '/login?kc_idp_hint=';
  cy.visit(urlToTenantLogin);
  cy.wait(2000); // Wait all the redirects to settle down
});

Then('the user can access the log in page with the corresponding tenant id showing in the URL', function () {
  subscriptionManagementObj.usernameEmailField().should('exist');
  subscriptionManagementObj.passwordField().should('exist');
  subscriptionManagementObj.loginButton().should('exist');
  cy.url().should('match', /realms\/[a-zA-Z0-9-]+\//g); // URL contains realms/<tenant id>/
});

Then('the user is redirected to the subscription management overview page', function () {
  subscriptionManagementObj.subscriptionManagementOverviewHeader().should('exist');
});
