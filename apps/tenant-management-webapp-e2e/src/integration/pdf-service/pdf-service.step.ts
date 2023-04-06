import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import PDFServicePage from './pdf-service.page';
import commonlib from '../common/common-library';
import common from '../common/common.page';
const pdfServiceObj = new PDFServicePage();
const commonObj = new common();
Given('a tenant admin user is on PDF service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('PDF', 4000);
});

Given('a tenant admin user is on PDF service templates page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('PDF', 4000);
  commonObj.serviceTab('PDF', 'Templates').click();
  cy.wait(4000);
});

Then('the user views the Pdf service overview content {string}', function (paragraphText) {
  pdfServiceObj.pdfAddTemplateBtn().invoke('text').should('contain', paragraphText);
});

When('the user clicks Add template button', function () {
  pdfServiceObj.pdfAddTemplateBtn().click();
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Add template modal', function () {
  pdfServiceObj.pdfAddTemplateModal().shadow().find('.modal-title').invoke('text').should('eq', 'Add template');
});

When('the user enters {string} as name, {string} as description in pdf template modal', function (name, description) {
  pdfServiceObj.pdfAddTemplateModalName().shadow().find('.input--goa').type(name, { force: true });
  pdfServiceObj
    .pdfAddTemplateModalDescription()
    .shadow()
    .find('.goa-textarea')
    .clear()
    .type(description, { force: true });
});

Then('the user clicks Save button in Add or Edit template modal', function () {
  pdfServiceObj.pdfAddTemplateModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(5000);
});

Then('the user clicks Cancel button in Add template modal', function () {
  pdfServiceObj.pdfAddTemplateModalCancelBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
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

Then('the user views Delete PDF template modal for {string}', function (templateName) {
  pdfServiceObj
    .pdfTemplateDeleteConfirmationModal()
    .shadow()
    .find('.modal-title')
    .invoke('text')
    .should('eq', 'Delete PDF template');
  pdfServiceObj
    .pdfTemplateDeleteConfirmationModalContent()

    .invoke('text')
    .should('contain', 'Delete ' + templateName);
});

When('the user clicks Confirm button in Delete PDF Template modal', function () {
  pdfServiceObj.pdfTemplateDeleteConfirmationModalDeleteBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then(
  'the user {string} unfilled badge on {string}, {string} and {string}',
  function (viewOrNot, name, templateId, description) {
    switch (viewOrNot) {
      case 'views':
        pdfServiceObj.pdfTempateUnfilledWarningIcon(name, templateId, description).should('exist');
        break;
      case 'should not view':
        pdfServiceObj.pdfTempateUnfilledWarningIcon(name, templateId, description).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

When(
  'the user clicks {string} icon of {string}, {string} and {string} on PDF templates page',
  function (iconType, name, templateId, description) {
    switch (iconType.toLowerCase()) {
      case 'edit':
        cy.viewport(1440, 900);
        pdfServiceObj.pdfTemplateEditBtn(name, templateId, description).click({ force: true });
        break;
      case 'delete':
        pdfServiceObj.pdfTemplateDeleteBtn(name, templateId, description).click({ force: true });
        break;
      default:
        expect(iconType.toLowerCase()).to.be.oneOf(['edit', 'delete']);
    }
  }
);

Then('the user views {string}, {string} and {string} in PDF template editor', function (name, templateId, description) {
  pdfServiceObj.pdfTemplateEditorNameField().invoke('text').should('eq', name);
  pdfServiceObj.pdfTemplateEditorTemplateIDField().invoke('text').should('eq', templateId);
  pdfServiceObj
    .pdfTemplateEditorDescriptionField()
    .invoke('text')
    .then((text) => text.toString().trim())
    .should('eq', description);
});

When('the user clicks "Edit" icon in editor screen', function () {
  pdfServiceObj.pdfTemplateEditorScreenEditIcon().shadow().find('.color').click();
});

Then('the user views {string}, {string} and {string} in PDF template modal', function (name, templateId, description) {
  pdfServiceObj.pdfAddTemplateModalName().invoke('attr', 'value').should('eq', name);
  pdfServiceObj.pdfTemplateModalTemplateIdField().invoke('attr', 'value').should('eq', templateId);
  pdfServiceObj
    .pdfTemplateModalDescriptionField()
    .shadow()
    .find('.goa-textarea')
    .invoke('val')
    .should('eq', description);
});

When('the user clicks Save button in PDF template modal', function () {
  pdfServiceObj.pdfTemplateModalSaveBtn().shadow().find('button').click();
  cy.wait(2000);
});

When('the user clicks the {string} tab in PDF template editor and view content', function (tab) {
  cy.wait(1000);
  switch (tab.toLowerCase()) {
    case 'body':
      pdfServiceObj
        .pdfTemplateBodyTab()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (!classAttr?.includes('active')) {
            pdfServiceObj.pdfTemplateBodyTab().click();
          }
        });
      pdfServiceObj.pdfTemplateBodyEditor().invoke('text').should('exist');
      break;
    case 'header':
      pdfServiceObj
        .pdfTemplateHeaderTab()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (!classAttr?.includes('active')) {
            pdfServiceObj.pdfTemplateHeaderTab().click();
          }
        });
      pdfServiceObj.pdfTemplateHeaderEditor().contains('header-wrapper');
      break;
    case 'footer':
      pdfServiceObj
        .pdfTemplateFooterTab()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (!classAttr?.includes('active')) {
            pdfServiceObj.pdfTemplateFooterTab().click();
          }
        });
      pdfServiceObj.pdfTemplateFooterEditor().contains('footer-wrapper');
      break;
    case 'css':
      pdfServiceObj
        .pdfTemplateCssTab()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (!classAttr?.includes('active')) {
            pdfServiceObj.pdfTemplateCssTab().click();
          }
        });
      pdfServiceObj.pdfTemplateCssEditor().contains('style');
      break;
    case 'test data':
      pdfServiceObj
        .pdfTemplateTestDataTab()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (!classAttr?.includes('active')) {
            pdfServiceObj.pdfTemplateTestDataTab().click();
          }
        });
      pdfServiceObj.pdfTemplateTestDataEditor().contains('service');
      break;
    case 'file history':
      pdfServiceObj
        .pdfTemplateFileHistoryTab()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (!classAttr?.includes('active')) {
            pdfServiceObj.pdfTemplateFileHistoryTab().click();
          }
        });
      break;
    default:
      expect(tab.toLowerCase()).to.be.oneOf(['body', 'header', 'footer', 'css', 'test data', 'file history']);
  }
});

When(
  'the user enters {string} as name and {string} as description in PDF template modal',
  function (name, description) {
    pdfServiceObj
      .pdfAddTemplateModalName()
      .shadow()
      .find('.input--goa')
      .invoke('removeAttr', 'disabled')
      .type(name, { force: true });
    pdfServiceObj
      .pdfTemplateModalDescriptionField()
      .shadow()
      .find('.goa-textarea')
      .clear()
      .type(description, { force: true });
  }
);

Then('the user views {string}', (content) => {
  pdfServiceObj.pdfNoFilesLists().invoke('text').should('contain', content);
});

When('the user clicks Generate PDF button in PDF template editor screen', () => {
  pdfServiceObj.pdfGeneratePDFButton().shadow().find('button').click({ force: true });
});

Then('the user can preview pdf file that generated in iframe', () => {
  cy.wait(10000);
  pdfServiceObj.pdfTemplatePDFPreview().should('exist');
});

Then('the file information is list in table', () => {
  pdfServiceObj.pdfNoFilesLists().should('not.exist');
});

When('the user clicks download button in PDF template editor', () => {
  pdfServiceObj.pdfDownloadIconOnTopIframe().shadow().find('.color').click({ force: true });
});

Then('the user views the PDF template editor screen', function () {
  pdfServiceObj.pdfTemplateEditorScreenTitle();
});

Then('the user clicks Back button in editor screen', function () {
  pdfServiceObj.pdfTemplateEditorScreenBackButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});
