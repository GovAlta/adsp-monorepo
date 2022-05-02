class FileServicePage {
  fileHeaderTag() {
    return cy.xpath('//h2[@class="file-header"]/following-sibling::span');
  }

  enableServiceButton() {
    return cy.get('button:contains("Enable service")');
  }

  disableServiceButton() {
    return cy.get('button:contains("Disable service")');
  }

  fileServiceTabs() {
    return cy.xpath('//h2[@class="file-header"]/following-sibling::div[1]//descendant::div');
  }

  fileServiceTab(text: string) {
    return cy.xpath(
      `//h2[@class="file-header"]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
    );
  }

  addFileTypeButton() {
    return cy.get('[data-testid="add-file-type-btn"]');
  }

  fileTypeModalTitle() {
    return cy.xpath('//*[@data-testid="file-type-modal"]//*[@class="modal-title"]');
  }

  fileTypeModalNameField() {
    return cy.get('[data-testid="file-type-modal-name-input"]');
  }

  fileTypeModalPublicCheckbox() {
    return cy.xpath(
      '//*[@data-testid="file-type-modal"]//input[@name="file-type-anonymousRead-checkbox"]/parent::*[contains(@class, "goa-checkbox-container")]'
    );
  }

  fileTypeModalReadCheckbox(roleName) {
    return cy.xpath(
      `//*[@data-testid="file-type-modal"]//td[text()="${roleName}"]/following-sibling::td//input[contains(@name, "read-role")]/parent::*[contains(@class, "goa-checkbox-container")]`
    );
  }

  fileTypeModalReadCheckboxes() {
    return cy.xpath(
      `//*[@data-testid="file-type-modal"]//input[contains(@name, "read-role")]/parent::*[contains(@class, "goa-checkbox-container")]`
    );
  }

  fileTypeModalModifyCheckbox(roleName) {
    return cy.xpath(
      `//*[@data-testid="file-type-modal"]//td[text()="${roleName}"]/following-sibling::td//input[contains(@name, "update-role")]/parent::*[contains(@class, "goa-checkbox-container")]`
    );
  }

  fileTypeModalModifyCheckboxes() {
    return cy.xpath(
      '//*[@data-testid="file-type-modal"]//input[contains(@name, "update-role")]/parent::*[contains(@class, "goa-checkbox-container")]'
    );
  }

  fileTypeModalSaveButton() {
    return cy.get('[data-testid="file-type-modal-save"]');
  }

  fileTypeTableBody() {
    return cy.xpath('//table[@data-testid="file-types-table"]//tbody');
  }

  fileTypeEditButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="file-types-table"]//*[contains(@data-testid, "file-type-row-edit-btn")])[${rowNumber}]`
    );
  }

  fileTypeDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="file-types-table"]//*[contains(@data-testid, "file-type-row-delete-btn")])[${rowNumber}]`
    );
  }

  fileTypeDeleteModalDeleteButton() {
    return cy.get('[data-testid="file-type-delete-modal-delete-btn"]');
  }

  fileTypeDeleteModalFileTypeName() {
    return cy.xpath('//*[@data-testid="file-delete-modal-content"]/p[contains(text(),"Deleting")]/b');
  }

  fileTypesErrorMessage() {
    return cy.get('[data-testid="FileType-0"]');
  }

  fileTypeDeleteModal() {
    return cy.xpath('//*[@data-testid="file-type-delete-modal"]');
  }

  fileTypeDeleteModalTitle() {
    return cy.xpath('//*[@data-testid="file-type-delete-modal"]//*[@class="modal-title"]');
  }

  fileTypeDeleteModalContent() {
    return cy.get('[data-testid="file-type-delete-modal-content"]');
  }

  fileTypeDeleteModalOkayBtn() {
    return cy.get('[data-testid="file-type-delete-modal-cancel-btn"]');
  }
}
export default FileServicePage;
