class PDFServicePage {
  pdfOverviewContent() {
    return cy.xpath('//h1[text()="PDF service"]/parent::main//p');
  }
  serviceTab(service, text) {
    return cy.xpath(`//h1[contains(text(),"${service}")]/ancestor::main//div[text()="${text}"]`);
  }
  pdfAddTemplateBtn() {
    return cy.get('[testid="add-templates"]');
  }

  pdfAddTemplateModalHeading() {
    return cy.xpath('//goa-modal[@open="true"]').shadow().find('[data-testid="modal-title"]');
  }

  pdfAddTemplateModalName() {
    return cy.get('[testid="pdf-template-name"]');
  }

  pdfAddTemplateModalDescription() {
    return cy.get('[testid="pdf-template-description"]');
  }

  pdfAddTemplateModalSaveBtn() {
    return cy.get('[testid="form-save"]');
  }

  pdfAddTemplateModalCancelBtn() {
    return cy.get('[testid="form-cancel"]');
  }

  tabTemplate() {
    return cy.xpath(
      '//h1[contains(text(),"PDF service")]/following-sibling::div[1]//descendant::div[contains(text(), "Templates")]'
    );
  }

  pdfTempate(name, templateId, description) {
    return cy.xpath(
      `//*[@data-testid="pdf-templates-table"]//tbody/tr/td[@data-testid="pdf-templates-name" and text()="${name}"]/following-sibling::td[@data-testid="pdf-templates-template-id" and text()="${templateId}"]/following-sibling::td[@data-testid="pdf-templates-description"]/div[text()="${description}"]/ancestor::tr`
    );
  }

  pdfTempateUnfilledWarningIcon(name, templateId, description) {
    return cy.xpath(
      `//*[@data-testid="pdf-templates-table"]//tbody/tr/td[@data-testid="pdf-templates-name" and text()="${name}"]/following-sibling::td[@data-testid="pdf-templates-template-id" and text()="${templateId}"]/following-sibling::td[@data-testid="pdf-templates-description"]/div[text()="${description}"]/ancestor::tr//*[@data-testid="icon-warning"]`
    );
  }

  pdfTemplateDeleteBtn(name, templateId, description) {
    return cy.xpath(
      `//*[@data-testid="pdf-templates-table"]//tbody/tr/td[@data-testid="pdf-templates-name" and text()="${name}"]/following-sibling::td[@data-testid="pdf-templates-template-id" and text()="${templateId}"]/following-sibling::td[@data-testid="pdf-templates-description"]/div[text()="${description}"]/ancestor::tr//goa-icon-button[@title="Delete"]`
    );
  }

  pdfTemplateEditBtn(name, templateId, description) {
    return cy.xpath(
      `//*[@data-testid="pdf-templates-table"]//tbody/tr/td[@data-testid="pdf-templates-name" and text()="${name}"]/following-sibling::td[@data-testid="pdf-templates-template-id" and text()="${templateId}"]/following-sibling::td[@data-testid="pdf-templates-description"]/div[text()="${description}"]/ancestor::tr//goa-icon-button[@title="Edit"]`
    );
  }

  pdfTemplateDeleteConfirmationModalHeading() {
    return cy.xpath('//*[@testid="delete-confirmation"]').shadow().find('[data-testid="modal-title"]');
  }

  pdfTemplateDeleteConfirmationModalContent() {
    return cy.xpath('//*[@testid="delete-confirmation" ]//div[2]');
  }

  pdfTemplateDeleteConfirmationModalDeleteBtn() {
    return cy.xpath('//*[@testid="delete-confirm"]');
  }

  pdfTemplateModalTemplateIdField() {
    return cy.get('[testid="pdf-template-id"]');
  }

  pdfTemplateModalDescriptionField() {
    return cy.xpath('//*[contains(@testid, "pdf-template-description")]');
  }

  pdfTemplateEditorNameField() {
    return cy.xpath('//*[@data-testid="template-name"]');
  }

  pdfTemplateEditorTemplateIDField() {
    return cy.xpath('//*[@data-testid="template-id"]');
  }

  pdfTemplateEditorDescriptionField() {
    return cy.xpath('//*[@data-testid="template-description"]');
  }

  pdfTemplateModalSaveBtn() {
    return cy.xpath('//button[@testid="template-form-save"]');
  }

  pdfTemplateBodyTab() {
    return cy.xpath('//div[text()="Body"]/parent::div');
  }

  pdfTemplateHeaderTab() {
    return cy.xpath('//div[text()="Header"]/parent::div');
  }

  pdfTemplateFooterTab() {
    return cy.xpath('//div[text()="Footer"]/parent::div');
  }

  pdfTemplateCssTab() {
    return cy.xpath('//div[text()="CSS"]/parent::div');
  }

  pdfTemplateTestDataTab() {
    return cy.xpath('//div[text()="Test data"]/parent::div');
  }

  pdfTemplateFileHistoryTab() {
    return cy.xpath('//div[text()="File history"]/parent::div');
  }

  pdfTemplateBodyEditor() {
    return cy.xpath('//*[@data-testid="pdf-edit-body"]//*[@class="monaco-scrollable-element editor-scrollable vs"]');
  }

  pdfTemplateHeaderEditor() {
    return cy.xpath('//*[@data-testid="pdf-edit-header"]//*[@class="monaco-scrollable-element editor-scrollable vs"]');
  }

  pdfTemplateFooterEditor() {
    return cy.xpath('//*[@data-testid="pdf-edit-footer"]//*[@class="monaco-scrollable-element editor-scrollable vs"]');
  }

  pdfTemplateCssEditor() {
    return cy.xpath('//*[@data-testid="pdf-edit-css"]//*[@class="monaco-scrollable-element editor-scrollable vs"]');
  }

  pdfTemplateTestDataEditor() {
    return cy.xpath(
      '//*[@data-testid="pdf-test-generator"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  pdfTemplatePDFPreview() {
    return cy.xpath('//iframe[@title="PDF preview"]');
  }

  pdfNoFilesLists() {
    return cy.xpath('//*[@data-testid="no-pdf-file-generated"]');
  }

  pdfDownloadIconOnTopIframe() {
    return cy.xpath('//*[@testid="download-template-icon"]');
  }

  pdfGeneratePDFButton() {
    return cy.xpath('//*[@testid="generate-template"]');
  }
  pdfTemplateEditorScreenTitle() {
    return cy.xpath('//div[text()="PDF / Template Editor"]');
  }

  pdfTemplateEditorPreviewTitle() {
    return cy.xpath('//div[text()="PDF preview"]');
  }

  pdfTemplateEditorScreenEditIcon() {
    return cy.xpath('//*[@testid="pdf-template-information-edit-icon"]');
  }

  pdfTemplateEditorScreenBackButton() {
    return cy.xpath('//*[@testid="template-form-close"]');
  }

  pdfTemplateEditorScreenSaveButton() {
    return cy.xpath('//*[@testid="template-form-save"]');
  }
}
export default PDFServicePage;
