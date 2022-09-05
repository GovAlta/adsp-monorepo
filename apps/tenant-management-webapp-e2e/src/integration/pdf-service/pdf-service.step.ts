import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import PDFServicePage from './pdf-service.page';
import commonlib from '../common/common-library';

const pdfServiceObj = new PDFServicePage();

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
  'the user {string} the PDF template of {string}, {string} and {string}',
  function (viewOrNot, name, templateId, description) {
    switch (viewOrNot) {
      case 'views':
        pdfServiceObj.pdfTempate(name, templateId, description).should('exist');
        break;
      case 'should not view':
        pdfServiceObj.pdfTempate(name, templateId, description).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

Then('the user navigates to Templates page', function () {
  pdfServiceObj.tabTemplate().click();
});

When('the user clicks Delete icon of {string}', function (templateName) {
  pdfServiceObj.pdfTemplateDeleteBtn(templateName).click();
});

Then('the user views Delete PDF Template modal for {string}', function (templateName) {
  pdfServiceObj.pdfTemplateDeleteConfirmationModalTitle().invoke('text').should('eq', 'Delete PDF Template');
  pdfServiceObj
    .pdfTemplateDeleteConfirmationModalContent()
    .invoke('text')
    .should('eq', 'Delete ' + templateName + '?');
});

When('the user clicks Confirm button in Delete PDF Template modal', function () {
  pdfServiceObj.pdfTemplateDeleteConfirmationModalDeleteBtn().click();
  cy.wait(2000);
});
