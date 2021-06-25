import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import tenantAdminPage from '../tenant-admin/tenant-admin.page';
import statusServicePage from './service-status.page';

const tenantAdminObj = new tenantAdminPage();
const statusServiceObj = new statusServicePage();

Given('a service owner user is on service status page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  tenantAdminObj
    .dashboardMenuItem('/admin/services/status')
    .click()
    .then(function () {
      cy.url().should('include', '/admin/services/status');
      cy.wait(4000);
    });
});

Then('the user views the health check guidelines', function () {
  statusServiceObj.statusTab('Guidelines').click();
  statusServiceObj.guidelinesTitle().then((guidelinesTitle) => {
    expect(guidelinesTitle.length).to.be.gt(0);
  });
});
