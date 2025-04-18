class DirectoryServicePage {
  directoryAsideItems(text, link) {
    return cy.xpath(
      `//h1[text()="Directory service"]/parent::main/following-sibling::aside//h3[text()="${text}"]/following-sibling::*/*[contains(text(), "${link}")]`
    );
  }

  directoryTable() {
    return cy.get('[data-testid="directory-table"]');
  }

  addEntryButton() {
    return cy.get('[testid="add-directory-btn"]');
  }

  entryModalServiceField() {
    return cy.get('[testid="directory-modal-service-input"]');
  }

  entryModalApiField() {
    return cy.get('[testid="directory-modal-api-input"]');
  }

  entryModalUrlField() {
    return cy.get('[testid="directory-modal-url-input"]');
  }

  entryModalSaveButton() {
    return cy.xpath('//*[@testid="directory-modal" and @open="true"]//*[@testid="directory-modal-save"]');
  }

  entryModalCancelButton() {
    return cy.xpath('//*[@testid="directory-modal" and @open="true"]//*[@testid="directory-modal-cancel"]');
  }

  entryModalServiceFieldErrorMsg() {
    return cy.xpath(
      '//input[@testid="directory-modal-service-input"]/parent::*/following-sibling::div[@class="error-msg"]'
    );
  }

  entryModalApiFieldErrorMsg() {
    return cy.xpath(
      '//input[@testid="directory-modal-api-input"]/parent::*/following-sibling::div[@class="error-msg"]'
    );
  }

  entryModalUrlFieldErrorMsg() {
    return cy.xpath(
      '//input[@testid="directory-modal-url-input"]/parent::*/following-sibling::div[@class="error-msg"]'
    );
  }

  entryNameUrlEditIcon(serviceName, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${url}")]/parent::*//*[contains(@testid, "directory-edit")]`
    );
  }

  entryNameApiUrlEditIcon(serviceName, api, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${api}")]/following-sibling::*[contains(text(), "${url}")]/parent::*//*[contains(@testid, "directory-edit")]`
    );
  }

  entryNameUrlDeleteIcon(serviceName, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${url}")]/parent::*//*[contains(@testid, "directory-delete")]`
    );
  }

  entryNameApiUrlDeleteIcon(serviceName, api, url) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following-sibling::*[contains(text(), "${api}")]/following-sibling::*[contains(text(), "${url}")]/parent::*//*[contains(@testid, "directory-delete")]`
    );
  }

  deleteModalTitle() {
    return cy.xpath('//*[@testid="delete-confirmation" and @open="true"]//*[@slot="heading"]');
  }

  deleteModalContent() {
    return cy.xpath('//*[@testid="delete-confirmation" and @open="true"]');
  }

  deleteModalDeleteBtn() {
    return cy.get('[testid="delete-confirm"]');
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
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/parent::*//*[@testid="directory-toggle-details-visibility" and @icon="eye"]`
    );
  }

  entryNameEyeOffIcon(serviceName) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/parent::*//*[@testid="directory-toggle-details-visibility" and @icon="eye-off"]`
    );
  }

  directoryServiceMetadata(serviceName) {
    return cy.xpath(
      `//*[@data-testid="directory-table"]//tbody//td[contains(text(), "${serviceName}")]/following::div[data-testid="details"]`
    );
  }

  addEntryActionBtn() {
    return cy.get('[icon="add"]');
  }

  entryModalTitle() {
    return cy.xpath('//*[@testid="directory-modal" and @open="true"]//*[@slot="heading"]');
  }
}
export default DirectoryServicePage;
