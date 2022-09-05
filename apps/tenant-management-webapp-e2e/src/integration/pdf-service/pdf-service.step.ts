import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import PdfServicePage from './pdf-service.page';
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
<<<<<<< HEAD

Then('the user views the Pdf service overview content {string}', function (paragraphText) {
  pdfServiceObj.pdfAddTemplateBtn().invoke('text').should('contain', paragraphText);
});

When('the user clicks Add template button', function () {
  pdfServiceObj.pdfAddTemplateBtn().click();
});

Then('the user views Add template modal', function () {
  pdfServiceObj.pdfAddTemplateModalTitle().invoke('text').should('eq', 'Add template');
});

When('the user enters {string} as name, {string} as description in pdf template modal', function (name, description) {
  pdfServiceObj.pdfAddTemplateModalName().clear().type(name);
  pdfServiceObj.pdfAddTemplateModalDescription().clear().type(description);
});

Then('the user clicks Save button in Add template modal', function () {
  pdfServiceObj.pdfAddTemplateModalSveBtn().click();
  cy.wait(2000);
});

Then(
  'the user views name {string}, template id {string} and description {string} on pdf templates',
  function (name, templateId, description) {
    pdfServiceObj.pdfTempate(name, templateId, description).click();
    cy.wait(2000);
  }
);

Then('the user navigates to Templates page', function () {
  pdfServiceObj.tabTemplate().click();
});
