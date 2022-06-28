import { Given, Then, When, And } from 'cypress-cucumber-preprocessor/steps';
import PdfServicePage from './pdf-service.page';
import Common from '../common/common.page';
import commonlib from '../common/common-library';

const pdfServiceObj = new PdfServicePage();
const commonObj = new Common();

Given('a tenant admin user is on pdf service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Pdf', 4000);
  commonObj.serviceTab('Pdf', 'Overview').click();
  cy.wait(2000);
});

Then('the user views the Pdf service overview content {string}', function (paragraphText) {
  pdfServiceObj.pdfOverviewContent().invoke('text').should('contain', paragraphText);
});
