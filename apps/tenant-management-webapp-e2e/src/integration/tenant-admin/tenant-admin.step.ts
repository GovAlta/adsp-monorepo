import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import tenantAdminPage from './tenant-admin.page';

const tenantAdminObj = new tenantAdminPage();
let responseObj: Cypress.Response;

When('the user visits the tenant management webapp', function () {
  cy.visit('/tenant-admin');
});

Then('the landing page is displayed', function () {
  cy.url().should('include', '/tenant-admin');
  tenantAdminObj.dashboardTitle().contains('Tenant Management');
  tenantAdminObj.dashboardServicesMenuCategory();
});

Given('the user is in the tenant management webapp', function () {
  cy.visit('/tenant-admin');
  cy.url().should('include', '/tenant-admin');
  tenantAdminObj.dashboardTitle().contains('Tenant Management');
  tenantAdminObj.dashboardServicesMenuCategory();
});

Then('the {string} landing page is displayed', function (type) {
  let urlPart = 'undefined';
  switch (type) {
    case 'administration':
      urlPart = '/tenant-admin/admin';
      break;
    case 'file services':
      urlPart = '/tenant-admin/services/file';
      break;
  }
  cy.url().should('include', urlPart);
});

When('the user selects the {string} menu item', function (menuItem) {
  let menuItemSelector = '';
  switch (menuItem) {
    case 'Administration':
      menuItemSelector = 'administration';
      break;
    case 'File Services':
      menuItemSelector = '/tenant-admin/services/file';
      break;
  }

  tenantAdminObj.dashboardMenuItem(menuItemSelector).click();
});

When('the user sends a configuration service request to {string}', function (
  request
) {
  const requestURL = Cypress.env('tenantManagementApi') + request;
  cy.request({
    method: 'GET',
    url: requestURL,
    auth: {
      bearer: Cypress.env('token'),
    },
  }).then(function (response) {
    responseObj = response;
  });
});

Then('the user gets a list of configuration options', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body.results).to.be.a('array');
});
