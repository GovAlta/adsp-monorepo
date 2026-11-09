import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import FormManagementAppPage from './form-management-app.page';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

const page = new FormManagementAppPage();

When('the user navigates to the form management login page for tenant {string}', function (tenantName: string) {
  cy.visit(`/${tenantName}/login?kc_idp_hint=`);
  cy.wait(2000);
});

Then('the user views the Keycloak login form', function () {
  page.usernameField().should('exist');
  page.passwordField().should('exist');
  page.loginButton().should('exist');
});

Given('an authenticated user is logged into the form management app for tenant {string}', function (tenantName: string) {
  cy.visit(`/${tenantName}/login?kc_idp_hint=`);
  page.usernameField().type(Cypress.env('email'));
  page.passwordField().type(Cypress.env('password'));
  page.loginButton().click();
  cy.wait(4000);
});

Then('the user views the form management overview page', function () {
  page.appHeader().invoke('attr', 'heading').should('contain', 'Form Management');
});

When('the user navigates to the forms definitions page', function () {
  cy.visit(`/${Cypress.env('tenantName')}/forms`);
  cy.wait(2000);
});

Then('the user views the form definitions list', function () {
  page.formDefinitionsList().should('exist');
});

When('the user navigates to the form filters page', function () {
  cy.visit(`/${Cypress.env('tenantName')}/filters`);
  cy.wait(2000);
});

Then('the user views the form filters content', function () {
  page.formFiltersContent().should('exist');
});

Then('no critical or serious accessibility issues on {string} page', function (pageName: string) {
  injectAxe();
  cy.checkA11y(
    null!,
    {},
    (violations) => {
      htmlReport(violations, true, pageName + '-all');
    },
    true
  );
  cy.checkA11y(null!, { includedImpacts: ['critical', 'serious'] }, (violations) => {
    htmlReport(violations, true, pageName + '-critical&serious');
  });
});
