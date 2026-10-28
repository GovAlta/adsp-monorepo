import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import TaskAppPage from './task-app.page';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

const taskAppObj = new TaskAppPage();

When('the user goes to the task management overview page', function () {
  cy.visit('/overview');
  cy.wait(2000); // Wait for page to settle
});

Then('the user views the task management landing page heading', function () {
  taskAppObj.landingPageHeading().should('exist');
});

When('the user navigates to the login page for tenant {string}', function (tenantName: string) {
  cy.visit('/' + tenantName + '/login?kc_idp_hint=');
  cy.wait(2000); // Wait for Keycloak redirect
});

Then('the user views the Keycloak login form', function () {
  taskAppObj.usernameField().should('exist');
  taskAppObj.passwordField().should('exist');
  taskAppObj.loginButton().should('exist');
});

Given(
  'an authenticated user is logged into the task management app for tenant {string}',
  function (tenantName: string) {
    cy.visit('/' + tenantName + '/login?kc_idp_hint=');
    taskAppObj.usernameField().type(Cypress.env('email'));
    taskAppObj.passwordField().type(Cypress.env('password'));
    taskAppObj.loginButton().click();
    cy.wait(4000); // Wait for OIDC redirect and app to initialize
  }
);

Then('the user views the task queues page', function () {
  taskAppObj.appHeader().invoke('attr', 'heading').should('contain', 'Task management');
});

When('the user opens the first available task queue', function () {
  // Click the first queue card/button in the queues list
  taskAppObj.firstQueueOpenButton().shadow().find('button').click({ force: true });
  cy.wait(2000); // Wait for queue detail to load
});

Then('the user views the task queue tasks page', function () {
  taskAppObj.tasksQueueBreadcrumb().should('exist');
});

Then('no critical or serious accessibility issues on {string} page', function (pageName) {
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
