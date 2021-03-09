import { getGreeting } from '../../support/app.po';
import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

import WelcomPage from './welcome.page';
import TenantAdminPage from '../tenant-admin/tenant-admin.page';
const welcomPageObj = new WelcomPage();
const tenantAdminPageObj = new TenantAdminPage();

// describe('tenant-management-webapp', () => {
//   beforeEach(() => cy.visit('/'));

//   it('should display welcome message', () => {
//     // Custom command example, see `../support/commands.ts` file
//     // cy.login('my-email@something.com', 'myPassword');

//     // Function helper example, see `../support/app.po.ts` file
//     getGreeting().contains('A platform built for government services');
//   });
// });

When('the user goes to the tenant management welcome page', function () {
  cy.visit('/');
});

Then('the user views the tenant management welcome page title', function () {
  getGreeting().contains('A platform built for government services');
});

Given('the user is on the tenant management welcome page', function () {
  cy.visit('/');
  getGreeting().contains('A platform built for government services');
});

When('the user clicks the sign in button', function () {
  // welcomPageObj.loginButton().click();
  cy.visit(Cypress.env('accessManagementApi') + '/admin/Auto-Test/console');
});

When('the user enters credentials and clicks login button', function () {
  welcomPageObj.usernameEmailField().type(Cypress.env('email'));
  welcomPageObj.passwordField().type(Cypress.env('password'));
  welcomPageObj.loginButton().click();
});

Then('the user is logged in tenant admin site', function () {
  cy.visit('/tenant-admin').then(() => {
    tenantAdminPageObj.dashboardTitle().contains('Tenant Management');
  });
});
