import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import tenantAdminPage from './tenant-admin.page';

const tenantAdminObj = new tenantAdminPage();

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
      urlPart = '/file-service';
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
      menuItemSelector = '/file-service';
      break;
  }

  tenantAdminObj.dashboardMenuItem(menuItemSelector).click();
});
