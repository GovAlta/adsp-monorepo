import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import FormAdminPage from './form-admin.page';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

const formsObj = new FormAdminPage();

When('a user goes to form admin app overview site', function () {
  cy.visit('/');
  cy.wait(2000); // Wait all the redirects to settle down
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

Given('an authenticated user is logged into form admin app site', function () {
  cy.visit('/' + Cypress.env('tenantName') + '/login?kc_idp_hint=');
  // Enter user name and password and click log in button
  formsObj.usernameEmailField().type(Cypress.env('email'));
  formsObj.passwordField().type(Cypress.env('password'));
  formsObj.loginButton().click();
  cy.wait(4000); // Wait all the redirects to settle down
});

Then('the user views the form administration page', function () {
  formsObj.formAdminLandingPageTitle().invoke('attr', 'heading').should('contain', 'Form administration');
});
