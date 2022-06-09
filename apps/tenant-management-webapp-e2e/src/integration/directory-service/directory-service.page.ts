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
    return cy.xpath(
      '//input[@data-testid="directory-modal-service-input"]/parent::*/following-sibling::div[@class="error-msg"]'
    );
  }

  entryModalApiFieldErrorMsg() {
    return cy.xpath(
      '//input[@data-testid="directory-modal-api-input"]/parent::*/following-sibling::div[@class="error-msg"]'
    );
  }

  entryModalUrlFieldErrorMsg() {
    return cy.xpath(
      '//input[@data-testid="directory-modal-url-input"]/parent::*/following-sibling::div[@class="error-msg"]'
    );
  }

  entryNameUrlEditIcon(serviceName, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${url}")]/parent::*//*[@data-testid="icon-create"]`
    );
  }

  entryNameApiUrlEditIcon(serviceName, api, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${api}")]/following-sibling::*[contains(text(), "${url}")]/parent::*//*[@data-testid="icon-create"]`
    );
  }

  entryNameUrlDeleteIcon(serviceName, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${url}")]/parent::*//*[@data-testid="icon-trash"]`
    );
  }

  entryNameApiUrlDeleteIcon(serviceName, api, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${api}")]/following-sibling::*[contains(text(), "${url}")]/parent::*//*[@data-testid="icon-trash"]`
    );
  }

  deleteModalContent() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]//*[@class="goa-scrollable"]');
  }

  deleteModalDeleteBtn() {
    return cy.get('[data-testid="delete-confirm"]');
  }

  directoryEntryWithNameUrl(serviceName, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${url}")]/parent::*`
    );
  }

  directoryEntryWithNameApiUrl(serviceName, api, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${api}")]/following-sibling::*[contains(text(), "${url}")]/parent::*`
    );
  }

  entryNameEyeIcon(serviceName) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/parent::*//*[@data-testid="icon-eye"]`
    );
  }

  entryNameEyeOffIcon(serviceName) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/parent::*//*[@data-testid="icon-eye-off"]`
    );
  }

  directoryServiceMetaData() {
    return cy.get('[data-testid="details"]');
  }
}
export default DirectoryServicePage;
