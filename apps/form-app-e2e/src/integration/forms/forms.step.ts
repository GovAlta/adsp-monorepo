import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import FormsPage from './forms.page';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

const formsObj = new FormsPage();

When('a user goes to form app overview site', function () {
  cy.visit('/');
  cy.wait(2000); // Wait all the redirects to settle down
});

Then('the user views the overview page of form app', function () {
  formsObj.formAppOverviewHeader().should('exist');
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

When('an authenticated user is in the form app', function () {
  cy.visit('/' + Cypress.env('realm') + '/login?kc_idp_hint=');
  // Enter user name and password and click log in button
  formsObj.usernameEmailField().type(Cypress.env('email'));
  formsObj.passwordField().type(Cypress.env('password'));
  formsObj.loginButton().click();
  cy.wait(4000); // Wait all the redirects to settle down
});

When('an authenticated user is logged in to see {string} application', function (formDefinition) {
  cy.visit('/' + Cypress.env('realm-name') + '/' + formDefinition + '/login?kc_idp_hint=');
  // Enter user name and password and click log in button
  formsObj.usernameEmailField().type(Cypress.env('email'));
  formsObj.passwordField().type(Cypress.env('password'));
  formsObj.loginButton().click();
  cy.wait(4000); // Wait all the redirects to settle down
});

Then('the user views the start application page for {string}', function (formDefinition) {
  formsObj.formStartApplicationSubtitle().invoke('text').should('contain', formDefinition);
});
