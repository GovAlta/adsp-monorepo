import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import FormManagementAppPage from './form-management-app.page';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

const page = new FormManagementAppPage();

const getAccessOrigin = () => {
  const accessManagementApi = Cypress.env('accessManagementApi');
  if (accessManagementApi) {
    return new URL(accessManagementApi).origin;
  }

  const accessOrigins: Record<string, string> = {
    DEV: 'https://access.adsp-dev.gov.ab.ca',
    UAT: 'https://access-uat.alberta.ca',
    PROD: 'https://access.alberta.ca',
  };
  const environmentName = Cypress.env('env-name');
  const origin = accessOrigins[environmentName];
  if (!origin) {
    throw new Error(`No Access Management origin configured for environment: ${environmentName}`);
  }

  return origin;
};

When('the user navigates to the form management login page for tenant {string}', function (tenantName: string) {
  cy.visit(`/${tenantName}/login?kc_idp_hint=`);
});

Then('the user views the Keycloak login form', function () {
  cy.origin(getAccessOrigin(), () => {
    cy.get('[name=username]').should('be.visible');
    cy.get('[name=password]').should('be.visible');
    cy.get('#kc-login').should('be.visible');
  });
});

Given(
  'an authenticated user is logged into the form management app for tenant {string}',
  function (tenantName: string) {
    cy.visit(`/${tenantName}/login?kc_idp_hint=`);
    const email = Cypress.env('email');
    const password = Cypress.env('password');
    cy.origin(getAccessOrigin(), { args: { email, password } }, ({ email, password }) => {
      cy.get('[name=username]').should('be.visible').type(email);
      cy.get('[name=password]').should('be.visible').type(password, { log: false });
      cy.get('#kc-login').click();
    });
    page.appHeader().should('have.attr', 'heading', 'Form Management');
  }
);

Then('the user views the form management dashboard page', function () {
  page.dashboardHeading().should('have.text', 'Form Management Dashboard');
});

When('the user navigates to the forms definitions page', function () {
  cy.visit(`/${Cypress.env('tenantName')}/forms`);
});

Then('the user views the form definitions list', function () {
  page.formDefinitionsList().should('be.visible');
});

When('the user navigates to the form filters page', function () {
  cy.visit(`/${Cypress.env('tenantName')}/filters`);
});

Then('the user views the form filters content', function () {
  page.formFiltersContent().should('be.visible');
});

Then('no critical or serious accessibility issues on {string}', function (pageName) {
  injectAxe();
  // check all accessibility issues and generate a report without failing the step.
  cy.checkA11y(
    null!,
    {},
    (violations) => {
      htmlReport(violations, true, pageName + '-all');
    },
    true
  );
  // check critical and serious accessibility issues and generate a report. Fail the step if there are any.
  cy.checkA11y(null!, { includedImpacts: ['critical', 'serious'] }, (violations) => {
    htmlReport(violations, true, pageName + '-critical&serious');
  });
});
