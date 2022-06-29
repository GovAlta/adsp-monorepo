import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import PdfServicePage from './pdf-service.page';
import commonlib from '../common/common-library';

const pdfServiceObj = new PdfServicePage();

Given('a tenant admin user is on Pdf service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Pdf', 4000);
  cy.wait(2000);
});

Then('the user views the Pdf service overview content {string}', function (paragraphText) {
  pdfServiceObj.pdfOverviewContent().invoke('text').should('contain', paragraphText);
});
