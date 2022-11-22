class PDFServicePage {
  pdfOverviewContent() {
    return cy.xpath('//h1[text()="PDF service"]/parent::main//p');
  }

  pdfAddTemplateBtn() {
    return cy.get('[data-testid="add-templates"]');
  }

  pdfAddTemplateModalTitle() {
    return cy.xpath(
      '//*[@data-testid="template-form" and @data-state="visible"]/*[@class="modal"]//*[@data-testid="template-form-title"]'
    );
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

  pdfTemplateDeleteConfirmationModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]//div[@class="modal-title"]');
  }

  pdfTemplateDeleteConfirmationModalContent() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]//div[@class="goa-scrollable"]');
  }

  pdfTemplateDeleteConfirmationModalDeleteBtn() {
    return cy.xpath(
      '//*[@data-testid="delete-confirmation" and @data-state="visible"]//button[@data-testid="delete-confirm"]'
    );
  }

  pdfTemplateModalNameField() {
    return cy.xpath('//input[contains(@data-testid, "modal-name-input")]');
  }

  pdfTemplateModalTemplateIdField() {
    return cy.xpath('//input[contains(@data-testid, "modal-template-id-input")]');
  }

  pdfTemplateModalDescriptionField() {
    return cy.xpath('//*[contains(@data-testid, "modal-description-textarea")]');
  }

  pdfTemplateModalSaveBtn() {
    return cy.xpath('//button[@data-testid="template-form-save"]');
  }

  pdfTemplateModalBodyTab() {
    return cy.xpath('//div[text()="Body"]/parent::div');
  }

  pdfTemplateModalHeaderFooterTab() {
    return cy.xpath('//div[text()="Header/Footer"]/parent::div');
  }

  pdfTemplateModalBodyEditor() {
    return cy.xpath(
      '//div[text()="Body"]//ancestor::div[@class="goa-form"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  pdfTemplateModalHeaderEditor() {
    return cy.xpath(
      '//div[text()="Header"]/following-sibling::div//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  pdfTemplateModalFooterEditor() {
    return cy.xpath(
      '//div[text()="Footer"]/following-sibling::div//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  pdfTemplateModalPDFPreview() {
    return cy.xpath('//iframe[@title="PDF preview"]');
  }

  pdfTemplateModalHeaderPreview() {
    return cy.xpath('//iframe[@title="Header"]');
  }

  pdfTemplateModalFooterPreview() {
    return cy.xpath('//iframe[@title="Footer"]');
  }
}
export default PDFServicePage;
