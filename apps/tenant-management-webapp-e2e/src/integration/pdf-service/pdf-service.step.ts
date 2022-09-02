import { Given } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';

Given('a tenant admin user is on PDF service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('PDF', 4000);
  cy.wait(2000);
});
