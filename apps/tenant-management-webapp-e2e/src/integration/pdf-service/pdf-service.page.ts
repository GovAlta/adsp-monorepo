class PdfServicePage {
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

  pdfAddTemplateModalSveBtn() {
    return cy.get('[data-testid="form-save"]');
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

  pdfTemplateDeleteBtn(name) {
    return cy.xpath(
      `//*[@data-testid="pdf-templates-table"]//tbody/tr/td[@data-testid="pdf-templates-name" and text()="${name}"]/following-sibling::td[@data-testid="pdf-templates-action"]//button[@title="Delete"]`
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
}
export default PdfServicePage;
