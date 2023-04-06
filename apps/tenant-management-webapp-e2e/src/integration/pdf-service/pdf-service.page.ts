class PDFServicePage {
  pdfOverviewContent() {
    return cy.xpath('//h1[text()="PDF service"]/parent::main//p');
  }
  serviceTab(service, text) {
    return cy.xpath(`//h1[contains(text(),"${service}")]/ancestor::main//div[text()="${text}"]`);
  }
  pdfAddTemplateBtn() {
    return cy.get('[data-testid="add-templates"]');
  }

  pdfAddTemplateModal() {
    return cy.xpath('//goa-modal');
  }

  pdfAddTemplateModalName() {
    return cy.get('[data-testid="pdf-template-name"]');
  }

  pdfAddTemplateModalDescription() {
    return cy.get('[data-testid="pdf-template-description"]');
  }

  pdfAddTemplateModalSaveBtn() {
    return cy.get('[data-testid="form-save"]');
  }

  pdfAddTemplateModalCancelBtn() {
    return cy.get('[data-testid="form-cancel"]');
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
      `//*[@data-testid="pdf-templates-table"]//tbody/tr/td[@data-testid="pdf-templates-name" and text()="${name}"]/following-sibling::td[@data-testid="pdf-templates-template-id" and text()="${templateId}"]/following-sibling::td[@data-testid="pdf-templates-description"]/div[text()="${description}"]/ancestor::tr//button[@title="Delete"]`
    );
  }

  pdfTemplateEditBtn(name, templateId, description) {
    return cy.xpath(
      `//*[@data-testid="pdf-templates-table"]//tbody/tr/td[@data-testid="pdf-templates-name" and text()="${name}"]/following-sibling::td[@data-testid="pdf-templates-template-id" and text()="${templateId}"]/following-sibling::td[@data-testid="pdf-templates-description"]/div[text()="${description}"]/ancestor::tr//button[@title="Edit"]`
    );
  }

  pdfTemplateDeleteConfirmationModal() {
    return cy.xpath('//*[@data-testid="delete-confirmation"]');
  }

  pdfTemplateDeleteConfirmationModalContent() {
    return cy.xpath('//*[@data-testid="delete-confirmation" ]//div[2]');
  }

  pdfTemplateDeleteConfirmationModalDeleteBtn() {
    return cy.xpath('//*[@data-testid="delete-confirm"]');
  }

  pdfTemplateModalTemplateIdField() {
    return cy.get('[data-testid="pdf-template-id"]');
  }

  pdfTemplateModalDescriptionField() {
    return cy.xpath('//*[contains(@data-testid, "pdf-template-description")]');
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
    return cy.xpath('//button[@data-testid="template-form-save"]');
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
    return cy.xpath(
      '//div[text()="Body"]//ancestor::div[@class="goa-form"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  pdfTemplateHeaderEditor() {
    return cy.xpath(
      '//div[text()="Header"]//ancestor::div[@class="goa-form"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  pdfTemplateFooterEditor() {
    return cy.xpath(
      '//div[text()="Footer"]//ancestor::div[@class="goa-form"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  pdfTemplateCssEditor() {
    return cy.xpath(
      '//div[text()="CSS"]//ancestor::div[@class="goa-form"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  pdfTemplateTestDataEditor() {
    return cy.xpath(
      '//div[text()="Test data"]//ancestor::div[@class="goa-form"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  pdfTemplatePDFPreview() {
    return cy.xpath('//iframe[@title="PDF preview"]');
  }

  pdfNoFilesLists() {
    return cy.xpath('//*[@data-testid="no-pdf-file-generated"]');
  }

  pdfDownloadIconOnTopIframe() {
    return cy.xpath('//*[@data-testid="download-template-icon"]');
  }

  pdfGeneratePDFButton() {
    return cy.xpath('//*[@data-testid="generate-template"]');
  }
  pdfTemplateEditorScreenTitle() {
    return cy.xpath('//div[text()="PDF / Template Editor"]');
  }

  pdfTemplateEditorPreviewTitle() {
    return cy.xpath('//div[text()="PDF preview"]');
  }

  pdfTemplateEditorScreenEditIcon() {
    return cy.xpath('//*[@data-testid="pdf-template-information-edit-icon"]');
  }
  pdfTemplateEditorScreenBackButton() {
    return cy.xpath('//*[@data-testid="template-form-close"]');
  }
  pdfTemplateEditorScreenSaveButton() {
    return cy.xpath('//*[@data-testid="template-form-save"]');
  }
}
export default PDFServicePage;
