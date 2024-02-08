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

  addFileTypeModalTitle() {
    return cy.xpath('//*[@data-testid="file-type-modal" and @open="true"]//*[@slot="heading"]');
  }

  addFileTypeModalNameField() {
    return cy.xpath(
      '//*[@data-testid="file-type-modal" and @open="true"]//*[@data-testid="file-type-modal-name-input"]'
    );
  }

  fileTypePageNameField() {
    return cy.get('[data-testid="fileType-name"]');
  }

  fileTypePagePublicCheckbox() {
    return cy.xpath('//goa-checkbox[@name="file-type-anonymousRead-checkbox"]');
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

  fileTypePageCheckboxesTables() {
    return cy.xpath('//*[@data-testid="filetype-editor"]//goa-table');
  }

  fileTypePageClientRolesTable(clientName) {
    return cy.xpath(
      `//*[@data-testid="filetype-editor"]//h4/div[text()="${clientName}"]/parent::h4/following-sibling::goa-table[1]`
    );
  }

  fileTypePageRolesTable() {
    return cy.xpath('//*[@data-testid="filetype-editor"]//h4[text()="autotest"]/following-sibling::goa-table[1]');
  }

  fileTypePageModifyCheckbox(roleName) {
    return cy.xpath(
      `//*[@data-testid="filetype-editor"]//td[text()="${roleName}"]/following-sibling::td//goa-checkbox[contains(@name, "modify-role")]`
    );
  }

  fileTypePageModifyCheckboxes() {
    return cy.xpath('//*[@data-testid="filetype-editor"]//goa-checkbox[contains(@name, "modify-role")]');
  }

  fileTypePageSaveButton() {
    return cy.xpath('//*[@data-testid="filetype-editor"]//*[@data-testid="form-save"]');
  }

  fileTypePageBackButton() {
    return cy.xpath('//*[@data-testid="filetype-editor"]//*[@data-testid="form-cancel"]');
  }

  addFileTypeModalSaveButton() {
    return cy.xpath('//*[@data-testid="file-type-modal" and @open="true"]//*[@data-testid="file-type-modal-save"]');
  }

  addFileTypeModalCancelButton() {
    return cy.xpath('//*[@data-testid="file-type-modal" and @open="true"]//*[@data-testid="file-type-modal-cancel"]');
  }

  addFileTypeModalNameFormItem() {
    return cy.xpath('//*[@data-testid="file-type-modal" and @open="true"]//goa-form-item[@label="Name"]');
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
    return cy.xpath('//goa-checkbox[@name="retentionActive"]');
  }

  fileRetentionPeriodInput() {
    return cy.xpath('//goa-input[@data-testid="delete-in-days-input"]');
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

  fileTypeClassificationDropdown() {
    return cy.xpath('//goa-dropdown[@name="securityClassifications"]');
  }

  fileTypeClassificationDropdownItems() {
    return cy.xpath('//goa-dropdown[@name="securityClassifications"]/goa-dropdown-item');
  }
}
export default FileServicePage;
