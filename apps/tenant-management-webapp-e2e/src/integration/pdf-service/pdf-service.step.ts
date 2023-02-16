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
});

Then('the user views the Pdf service overview content {string}', function (paragraphText) {
  pdfServiceObj.pdfAddTemplateBtn().invoke('text').should('contain', paragraphText);
});

When('the user clicks Add template button', function () {
  pdfServiceObj.pdfAddTemplateBtn().click();
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Add template modal', function () {
  pdfServiceObj.pdfAddTemplateModalTitle().invoke('text').should('eq', 'Add template');
});

When('the user enters {string} as name, {string} as description in pdf template modal', function (name, description) {
  pdfServiceObj.pdfAddTemplateModalName().clear().type(name);
  pdfServiceObj
    .pdfAddTemplateModalDescription()
    .shadow()
    .find('.goa-textarea')
    .clear()
    .type(description, { force: true });
});

Then('the user clicks Save button in Add template modal', function () {
  pdfServiceObj.pdfAddTemplateModalSaveBtn().click();
  cy.wait(2000);
});

Then('the user clicks Cancel button in Add template modal', function () {
  pdfServiceObj.pdfAddTemplateModalCancelBtn().click();
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
  pdfServiceObj.pdfTemplateDeleteConfirmationModalTitle().invoke('text').should('eq', 'Delete PDF template');
  pdfServiceObj
    .pdfTemplateDeleteConfirmationModalContent()
    .invoke('text')
    .should('contain', 'Delete ' + templateName);
});

When('the user clicks Confirm button in Delete PDF Template modal', function () {
  pdfServiceObj.pdfTemplateDeleteConfirmationModalDeleteBtn().click();
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

Then('the user views {string}, {string} and {string} in PDF template modal', function (name, templateId, description) {
  pdfServiceObj.pdfTemplateModalNameField().invoke('attr', 'value').should('eq', name);
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
  cy.wait(1000);
});

When('the user enters {string} for {string} in PDF template modal', function (content, tab) {
  switch (tab.toLowerCase()) {
    case 'body':
      pdfServiceObj
        .pdfTemplateModalBodyTab()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (!classAttr?.includes('active')) {
            pdfServiceObj.pdfTemplateModalBodyTab().click();
          }
        });
      pdfServiceObj.pdfTemplateModalBodyEditor().type(content, { parseSpecialCharSequences: false });
      break;
    case 'header':
      pdfServiceObj
        .pdfTemplateModalHeaderTab()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (!classAttr?.includes('active')) {
            pdfServiceObj.pdfTemplateModalHeaderTab().click();
          }
        });
      pdfServiceObj.pdfTemplateModalHeaderEditor().type(content), { parseSpecialCharSequences: false };
      break;
    case 'footer':
      pdfServiceObj
        .pdfTemplateModalFooterTab()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (!classAttr?.includes('active')) {
            pdfServiceObj.pdfTemplateModalFooterTab().click();
          }
        });
      pdfServiceObj.pdfTemplateModalFooterEditor().type(content, { parseSpecialCharSequences: false });
      break;
    default:
      expect(tab.toLowerCase()).to.be.oneOf(['body', 'header', 'footer']);
  }
});

When(
  'the user enters {string} as name and {string} as description in PDF template modal',
  function (name, description) {
    pdfServiceObj.pdfTemplateModalNameField().clear().type(name);
    pdfServiceObj
      .pdfTemplateModalDescriptionField()
      .shadow()
      .find('.goa-textarea')
      .clear()
      .type(description, { force: true });
  }
);

Then('the user views the {string} preview of {string}', function (type, previewContent) {
  cy.wait(2000);
  switch (type.toLowerCase()) {
    case 'pdf':
      pdfServiceObj.pdfTemplateModalPDFPreview().then(function ($iFrame) {
        const iFrameContent = $iFrame.contents().find('body');
        cy.wrap(iFrameContent).should('include.text', previewContent);
      });
      break;
    case 'header':
      pdfServiceObj.pdfTemplateModalHeaderPreview().then(function ($iFrame) {
        const iFrameContent = $iFrame.contents().find('body');
        cy.wrap(iFrameContent).should('include.text', previewContent);
      });
      break;
    case 'footer':
      pdfServiceObj.pdfTemplateModalFooterPreview().then(function ($iFrame) {
        const iFrameContent = $iFrame.contents().find('body');
        cy.wrap(iFrameContent).invoke('text').should('contain', previewContent);
      });
      break;
    default:
      expect(type.toLowerCase()).to.be.oneOf(['pdf', 'header', 'footer']);
  }
});
