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
      `//*[@data-testid="pdf-templates-table"]//table/div/tbody//td[contains(text(), "${name}")]/following-sibling::*[contains(text(), "${templateId}")/following-sibling::*[contains(text(), "${description}")]/parent::*`

      // [data-testid=pdf-templates-table-header-name]
      // [data-testid=pdf-templates-table-header-description]
    );
  }
}
export default PdfServicePage;
