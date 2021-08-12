class FileServicePage {
  fileHeaderTag() {
    return cy.xpath('//h2[@class="file-header"]/following-sibling::span');
  }

  enableServiceButton() {
    return cy.get('button:contains("Enable Service")');
  }

  disableServiceButton() {
    return cy.get('button:contains("Disable Service")');
  }

  fileServiceTabs() {
    return cy.xpath('//h2[@class="file-header"]/following-sibling::div[1]//descendant::div');
  }

  fileServiceTab(text: string) {
    return cy.xpath(
      `//h2[@class="file-header"]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
    );
  }

  fileTypesAPIsTitle() {
    return cy.xpath('//h2[contains(text(), "File Types APIs")]');
  }

  filesAPIsTitle() {
    return cy.xpath('//h2[contains(text(), "Files APIs")]');
  }

  newFileTypeButton() {
    return cy.get('[data-testid="new-file-type-button-top"]');
  }

  newFileTypeNameField() {
    return cy.get('[data-testid="new-file-type-name"]');
  }

  newReadRolesDropdown() {
    return cy.get('[data-testid="new-readRoles"]');
  }

  newReadRolesDropdownItem(text) {
    return cy.xpath(`//*[@data-testid="new-readRoles"]//*[contains(text(), "${text}")]`);
  }

  newUpdateRolesDropdown() {
    return cy.get('[data-testid="new-updateRoles"]');
  }

  newUpdateRolesDropdownItem(text) {
    return cy.xpath(`//*[@data-testid="new-updateRoles"]//*[contains(text(), "${text}")]`);
  }

  newFileTypeConfirmButton() {
    return cy.get('[data-testid="confirm-new"]');
  }

  fileTypeTable() {
    return cy.xpath('//table[@data-testid="file-type-table"]');
  }

  fileTypeTableBody() {
    return cy.xpath('//table[@data-testid="file-type-table"]//tbody');
  }

  fileTypeEditButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="file-type-table"]//*[@data-testid="edit-file-type"])[${rowNumber}]`);
  }

  fileTypeNameEditField(rowNumber) {
    return cy.xpath(`(//table[@data-testid="file-type-table"]//*[@data-testid="name"])[${rowNumber}]/input`);
  }

  fileTypeReadRoles(rowNumber) {
    return cy.xpath(`(//table[@data-testid="file-type-table"]//*[@data-testid="update-readRoles"])[${rowNumber}]`);
  }

  fileTypeReadRolesDropdownItems(rowNumber) {
    return cy.xpath(`(//*[@data-testid="update-readRoles"])[${rowNumber}]//div[@role="listitem"]`);
  }

  fileTypeReadRolesDropdownItem(rowNumber, text) {
    return cy.xpath(`(//*[@data-testid="update-readRoles"])[${rowNumber}]//*[contains(text(), "${text}")]`);
  }

  fileTypeReadRolesDropdownSelectedItems(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="file-type-table"]//*[@data-testid="update-readRoles"])[${rowNumber}]//*[@class="option selected"]`
    );
  }

  fileTypeUpdateRoles(rowNumber) {
    return cy.xpath(`(//table[@data-testid="file-type-table"]//*[@data-testid="update-updateRoles"])[${rowNumber}]`);
  }

  fileTypeUpdateRolesDropdownItem(rowNumber, text) {
    return cy.xpath(`(//*[@data-testid="update-updateRoles"])[${rowNumber}]//*[contains(text(), "${text}")]`);
  }

  fileTypeConfirmButton() {
    return cy.xpath('//table[@data-testid="file-type-table"]//*[@data-testid="confirm-update"]');
  }

  fileTypeDeleteButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="file-type-table"]//*[@data-testid="delete-file-type"])[${rowNumber}]`);
  }

  fileTypeDeleteModalDeleteButton() {
    return cy.get('[data-testid="delete-modal-delete-button"]');
  }

  fileTypeDeleteModalFileTypeName() {
    return cy.xpath('//*[@data-testid="callout-content"]/p[contains(text(),"Deleting")]/b');
  }

  fileTypesErrorMessage() {
    return cy.get('[data-testid="FileType-0"]');
  }
}

export default FileServicePage;
