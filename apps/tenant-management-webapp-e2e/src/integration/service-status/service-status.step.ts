import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import serviceStatusPage from './service-status.page';

const commonObj = new common();
const statusServiceObj = new serviceStatusPage();

Given('a service owner user is on service status page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonObj
    .adminMenuItem('/admin/services/status')
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
