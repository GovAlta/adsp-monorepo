import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import notificationsPage from './notifications.page';

const commonObj = new common();
const notificationsObj = new notificationsPage();

Given('a service owner user is on notification overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonObj
    .adminMenuItem('/admin/services/notifications')
    .click()
    .then(function () {
      cy.url().should('include', '/admin/services/notifications');
      cy.wait(4000);
    });
});
