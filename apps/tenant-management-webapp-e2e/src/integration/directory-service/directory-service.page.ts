class DirectoryServicePage {
  directoryOverviewContent() {
    return cy.xpath('//h1[text()="Directory service"]/parent::main//p');
  }

  directoryAsideItems(text, link) {
    return cy.xpath(
      `//h1[text()="Directory service"]/parent::main/following-sibling::aside//h3[text()="${text}"]/following-sibling::*[contains(text(), "${link}")]`
    );
  }

  directoryTable() {
    return cy.get('[data-testid="directory-table"]');
  }

  addEntryButton() {
    return cy.get('[data-testid="add-directory-btn"]');
  }

  addApplicationModalTitle() {
    return cy.get('[data-testid="add-directory-btn"]');
  }

  addEntryModalTitle() {
    return cy.xpath(
      '//div[@class="modal-root" and @data-state="visible"]/div[@class="modal"]/div[@class="modal-container"]/div[@class="modal-title"]'
    );
  }

  entryModalServiceField() {
    return cy.get('[data-testid="directory-modal-service-input"]');
  }

  entryModalApiField() {
    return cy.get('[data-testid="directory-modal-api-input"]');
  }

  entryModalUrlField() {
    return cy.get('[data-testid="directory-modal-url-input"]');
  }

  entryModalSaveButton() {
    return cy.xpath(
      '//*[@data-testid="directory-modal" and @data-state="visible"]//*[@data-testid="directory-modal-save"]'
    );
  }

  entryModalCancelButton() {
    return cy.xpath(
      '//*[@data-testid="directory-modal" and @data-state="visible"]//*[@data-testid="directory-modal-cancel"]'
    );
  }

  entryModalServiceFieldErrorMsg() {
    return cy.xpath('//input[@data-testid="directory-modal-service-input"]/following-sibling::div[@class="error-msg"]');
  }

  entryModalApiFieldErrorMsg() {
    return cy.xpath('//input[@data-testid="directory-modal-api-input"]/following-sibling::div[@class="error-msg"]');
  }

  entryModalUrlFieldErrorMsg() {
    return cy.xpath('//input[@data-testid="directory-modal-url-input"]/following-sibling::div[@class="error-msg"]');
  }

  editEntryButton(service, url) {
    return cy.xpath(
      `//div[@[data-testid="directory-table"] and contains(text(), "${service}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${url}")]/following-sibling::td//*[@data-testid="edit-details"]`
    );
  }

  entryTableBody() {
    return cy.get('tbody');
  }

  entryTableServiceColumn() {
    return cy.get('td[headers="service"]');
  }

  entryTableUrlColumn() {
    return cy.get('td[headers="url"]');
  }

  entryEditIcon(serviceName, url) {
    return cy.xpath(
      `//*[@data-testid="subscribers-list-title"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${url}")]/parent::*//*[@data-testid="icon-create"]`
    );
  }

  entryDeleteIcon() {
    return cy.xpath('//*[@data-testid="toggle-details-visibility"]/div');
  }
}
export default DirectoryServicePage;
