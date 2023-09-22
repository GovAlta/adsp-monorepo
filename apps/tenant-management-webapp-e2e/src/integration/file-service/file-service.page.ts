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

  fileTypeModalClientRolesTable(clientName) {
    return cy.xpath(
      `//*[@data-testid="file-type-modal" and @open="true"]//h4/div[text()="${clientName}"]/parent::h4/following-sibling::goa-table`
    );
  }

  fileTypeModalRolesTable() {
    return cy.xpath(
      '//*[@data-testid="file-type-modal" and @open="true"]//h4[text()="autotest"]/following-sibling::goa-table[1]'
    );
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
    return cy.xpath(
      '//*[@data-testid="delete-confirmation" and @open="true"]//goa-button[@data-testid="delete-confirm"]'
    );
  }

  fileTypeDeleteModalFileTypeName() {
    return cy.xpath('//*[@data-testid="file-delete-modal-content"]/p[contains(text(),"Deleting")]/b');
  }

  fileTypesErrorMessage() {
    return cy.get('[data-testid="FileType-0"]');
  }

  fileTypeDeleteModal() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @open="true"]');
  }

  fileTypeDeleteModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @open="true"]//*[@slot="heading"]');
  }

  fileTypeDeleteModalContent() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @open="true"]//p');
  }

  fileTypeInUseModalTitle() {
    return cy.xpath('//*[@data-testid="file-type-delete-modal" and @open="true"]//*[@slot="heading"]');
  }

  fileTypeInUseModalContent() {
    return cy.xpath('//*[@data-testid="file-type-delete-modal" and @open="true"]//p');
  }

  fileTypeInUseModalOkayButton() {
    return cy.xpath(
      '//*[@data-testid="file-type-delete-modal" and @open="true"]//goa-button[@data-testid="file-type-delete-modal-cancel-btn"]'
    );
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

  uploadedFilesPageTitle() {
    return cy.xpath('//h2[text()="Please upload a file"]');
  }

  uploadedFilesSearchFileName() {
    return cy.xpath('//goa-input[@id="name"]');
  }

  uploadedFilesSearchButton() {
    return cy.xpath('//goa-button[text()="Search"]');
  }

  uploadedFilesDownloadButton(fileName) {
    return cy.xpath(
      `//tbody//td[text()="${fileName}"]/following-sibling::td//goa-icon-button[@data-testid="download-icon"]`
    );
  }
}
export default FileServicePage;
