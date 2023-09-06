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
    return cy.xpath('//*[@data-testid="file-type-modal" and @open="true"]//*[@slot="heading"]');
  }

  fileTypeModalNameField() {
    return cy.xpath(
      '//*[@data-testid="file-type-modal" and @open="true"]//*[@data-testid="file-type-modal-name-input"]'
    );
  }

  fileTypeModalPublicCheckbox() {
    return cy.xpath(
      '//*[@data-testid="file-type-modal" and @open="true"]//goa-checkbox[@name="file-type-anonymousRead-checkbox"]'
    );
  }

  fileTypeModalReadCheckbox(roleName) {
    return cy.xpath(
      `//*[@data-testid="file-type-modal" and @open="true"]//td[text()="${roleName}"]/following-sibling::td//goa-checkbox[contains(@name, "read-role")]`
    );
  }

  fileTypeModalReadCheckboxes() {
    return cy.xpath(`//*[@data-testid="file-type-modal" and @open="true"]//goa-checkbox[contains(@name, "read-role")]`);
  }

  fileTypeModalCheckboxesTable(tableName) {
    return cy.xpath(
      `//*[@data-testid="file-type-modal" and @open="true"]//h4[text()="${tableName}"]/following-sibling::goa-table`
    );
  }

  fileTypeModalCheckboxesTables() {
    return cy.xpath(`//*[@data-testid="file-type-modal" and @open="true"]//goa-table`);
  }

  fileTypeModalModifyCheckbox(roleName) {
    return cy.xpath(
      `//*[@data-testid="file-type-modal" and @open="true"]//td[text()="${roleName}"]/following-sibling::td//goa-checkbox[contains(@name, "modify-role")]`
    );
  }

  fileTypeModalModifyCheckboxes() {
    return cy.xpath(
      '//*[@data-testid="file-type-modal" and @open="true"]//goa-checkbox[contains(@name, "modify-role")]'
    );
  }

  fileTypeModalSaveButton() {
    return cy.xpath('//*[@data-testid="file-type-modal" and @open="true"]//*[@data-testid="file-type-modal-save"]');
  }

  fileTypeModalCancelButton() {
    return cy.xpath('//*[@data-testid="file-type-modal" and @open="true"]//*[@data-testid="file-type-modal-cancel"]');
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
    return cy.xpath('//*[@data-testid="file-type-delete-modal"]//*[@slot="heading"]');
  }

  fileTypeDeleteModalContent() {
    return cy.xpath('//*[@data-testid="file-type-delete-modal"]//p');
  }

  fileTypeDeleteModalOkayBtn() {
    return cy.xpath('//*[@data-testid="file-type-delete-modal"]//goa-button');
  }

  coreFileTypesTitle() {
    return cy.xpath('//*[text()="Core file types"]');
  }

  coreFileTypesTable() {
    return cy.xpath('//*[text()="Core file types"]/parent::*//*[@data-testid="file-types-table"]//tbody');
  }

  fileRetentionCheckBox() {
    return cy.xpath('//*[@data-testid="file-type-modal" and @open="true"]//goa-checkbox[@name="retentionActive"]');
  }

  fileRetentionDelayInput() {
    return cy.xpath(
      '//*[@data-testid="file-type-modal" and @open="true"]//goa-input[@data-testid="delete-in-days-input"]'
    );
  }
}
export default FileServicePage;
