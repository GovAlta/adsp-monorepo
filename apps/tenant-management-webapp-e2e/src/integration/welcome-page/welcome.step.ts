import { getGreeting } from '../../support/app.po';
import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

import WelcomPage from './welcome.page';
import TenantAdminPage from '../tenant-admin/tenant-admin.page';
const welcomPageObj = new WelcomPage();
const tenantAdminPageObj = new TenantAdminPage();

When('the user goes to the tenant management welcome page', function () {
  const urlToSkipSSO = Cypress.config().baseUrl + '?kc_idp_hint=';
  cy.visit(urlToSkipSSO);
});

Then('the user views the tenant management welcome page title', function () {
  getGreeting().contains('A platform built for government services');
});

Given('the user is on the tenant management welcome page', function () {
  const urlToSkipSSO = Cypress.config().baseUrl + '?kc_idp_hint=';
  cy.visit(urlToSkipSSO);
  getGreeting().contains('A platform built for government services');
});

When('the user clicks the sign in button', function () {
  welcomPageObj.signinButton().click();
});

Then('the user is logged in tenant admin site', function () {
  cy.url().should('should have', '/tenant-admin');
  tenantAdminPageObj.dashboardTitle().contains('Tenant Management');
});
