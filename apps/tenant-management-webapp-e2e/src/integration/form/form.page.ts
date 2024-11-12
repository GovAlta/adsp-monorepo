class FormPage {
  addDefinitionBtn() {
    return cy.get('goa-button:contains("Add definition")');
  }

  addDefinitionModalTitle() {
    return cy.xpath('//*[@data-testid="definition-form" and @open="true"]//*[@slot="heading"]');
  }

  addDefinitionModalCancelButton() {
    return cy.get('[data-testid="add-edit-form-cancel"]');
  }

  definitionTable() {
    return cy.get('[data-testid="form-definitions-table"]');
  }

  addDefinitionNameTextField() {
    return cy.xpath('//goa-form-item[@label="Name"]/goa-input[@data-testid="form-definition-name"]');
  }

  addDefinitionDescriptionField() {
    return cy.xpath('//goa-form-item[@label="Description"]//goa-textarea[@data-testid="form-definition-description"]');
  }

  nameFormItem() {
    return cy.xpath('//goa-form-item[@label="Name"]');
  }

  addDefinitionModalSaveButton() {
    return cy.xpath('//goa-button[text()="Save" and @disabled="false"]');
  }

  editorDefinitionNameValue() {
    return cy.get('[data-testid="template-name"]');
  }

  editorDefinitionDescriptionValue() {
    return cy.get('[data-testid="template-description"]');
  }

  editorSaveButtonEnabled() {
    return cy.xpath('//*[@data-testid="definition-form-save" and @disabled="false"]');
  }

  editorSaveButton() {
    return cy.xpath('//*[@data-testid="definition-form-save"]');
  }

  editorBackButton() {
    return cy.xpath('//*[@data-testid="form-editor-cancel" and @disabled="false"]');
  }

  editorCheckboxesTables() {
    return cy.xpath('//*[@data-testid="form-roles-tab"]//goa-table');
  }

  editorClientRolesTable(clientName) {
    return cy.xpath(
      `//*[@data-testid="form-roles-tab"]//h4/div[text()="${clientName}"]/parent::h4/following-sibling::goa-table[1]`
    );
  }

  editorRolesTable() {
    return cy.xpath('//*[@data-testid="form-roles-tab"]//h4[text()="autotest"]/following-sibling::goa-table[1]');
  }

  definitionsTableBody() {
    return cy.xpath('//table[@data-testid="form-definitions-table"]//tbody');
  }

  definitionEditButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="form-definitions-table"]//*[contains(@data-testid, "form-definition-edit")])[${rowNumber}]`
    );
  }

  definitionDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="form-definitions-table"]//*[contains(@data-testid, "form-definition-delete")])[${rowNumber}]`
    );
  }

  definitionEditorTab(tabName) {
    return cy.xpath(`//*[contains(@data-testid, "tab") and text()="${tabName}"]`);
  }

  definitionEditorEditButton() {
    return cy.xpath('//*[@class="editColumn"]//*[text()="Edit"]');
  }

  definitionEditorEditDefinitionModal() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="definition-form"]');
  }

  definitionEditorEditDefinitionModalTitle() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="definition-form"]/*[@slot="heading"]');
  }

  definitionEditorEditDefinitionModalNameInput() {
    return cy.xpath('//goa-input[@data-testid="form-definition-name"]');
  }

  definitionEditorEditDefinitionModalDescriptionField() {
    return cy.xpath('//goa-textarea[@data-testid="form-definition-description"]');
  }

  definitionEditorEditDefinitionModalSaveButton() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="definition-form"]//goa-button[text()="Save"]');
  }

  definitionEditorRolesTables() {
    return cy.xpath('//*[@data-testid="form-roles-tab"]//h4/following-sibling::goa-table[1]');
  }

  definitionEditorSubmissionConfigSubmission() {
    return cy.xpath('//*[@data-testid="lifecycle"]');
  }

  definitionEditorSubmissionConfigSubmissionRecordCheckbox() {
    return cy.xpath('//*[@data-testid="lifecycle"]//goa-checkbox[@data-testid="submission-records"]');
  }

  definitionEditorSubmissionConfigSubmissionRecordCheckboxInfoCircle() {
    return cy.xpath(
      '//*[@data-testid="lifecycle"]//goa-checkbox[@data-testid="submission-records"]/parent::*/following-sibling::goa-tooltip'
    );
  }

  definitionEditorSubmissionConfigAddStateBtn() {
    return cy.xpath('//goa-button[@data-testid="Add state"]');
  }

  definitionEditorSubmissionConfigDispositionStatesInfoCircle() {
    return cy.xpath('//*[@data-testid="lifecycle"]//h3[text()="Disposition states"]/following-sibling::*//goa-tooltip');
  }

  definitionEditorSubmissionConfigDispositionStatesInfoBoxCloseBtn() {
    return cy.xpath(
      '//*[@data-testid="lifecycle"]//h3[text()="Disposition states"]/following-sibling::*//*[@class="small-close-button"]'
    );
  }

  definitionEditorSubmissionConfigDispositionStateModalTitle() {
    return cy.xpath('//goa-modal[@open="true"]/div[@slot="heading"]');
  }

  definitionEditorSubmissionConfigDispositionStateModalNameField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-input[@name="disposition-name"]');
  }

  definitionEditorSubmissionConfigDispositionStateModalDescriptionField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-textarea[@name="disposition-description"]');
  }

  definitionEditorSubmissionConfigDispositionStateModalSaveBtn() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[@data-testid="disposition-state-save"]');
  }

  definitionEditorSubmissionConfigEditDispositionStateModalCancelBtn() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[@data-testid="disposition-state-cancel-edit"]');
  }

  definitionEditorSubmissionConfigDispositionStateTableBody() {
    return cy.xpath('//div[@data-testid="lifecycle"]//tbody');
  }

  definitionEditorSubmissionConfigDispositionStateTableArrowIcons(index) {
    return cy.xpath(`//div[@data-testid="lifecycle"]//tbody//tr[${index}]//goa-icon-button[contains(@icon,"arrow")]`);
  }

  definitionEditorSubmissionConfigDispositionStateEditBtn(index) {
    return cy.xpath(`(//div[@data-testid="lifecycle"]//tbody//goa-icon-button[@icon="create"])[${index}]`);
  }

  definitionEditorSubmissionConfigDispositionStateDeleteBtn(index) {
    return cy.xpath(`(//div[@data-testid="lifecycle"]//tbody//goa-icon-button[@icon="trash"])[${index}]`);
  }

  // index number for arrow down is row # plus 1 because the first row doesn't have arrow up button
  definitionEditorSubmissionConfigDispositionStateArrowUpBtn(index) {
    return cy.xpath(`(//div[@data-testid="lifecycle"]//tbody//goa-icon-button[@icon="arrow-up"])[${index}]`);
  }

  definitionEditorSubmissionConfigDispositionStateArrowDownBtn(index) {
    return cy.xpath(`(//div[@data-testid="lifecycle"]//tbody//goa-icon-button[@icon="arrow-down"])[${index}]`);
  }

  definitionEditorSubmissionConfigTaskQueueToProcessDropdown() {
    return cy.xpath('//goa-dropdown[@name="queueTasks"]');
  }

  definitionEditorSubmissionConfigTaskQueueToProcessDropdownItem(value) {
    return cy.xpath(`//goa-dropdown[@name="queueTasks"]/goa-dropdown-item[@value="${value}"]`);
  }

  definitionEditorSubmissionConfigTaskQueueToProcessDropdownInfoCircle() {
    return cy.xpath('//goa-dropdown[@name="queueTasks"]/parent::*/preceding-sibling::div[@class="info-circle"]');
  }

  definitionEditorSubmissionConfigTaskQueueToProcessDropdownInfoBox() {
    return cy.xpath(
      '//goa-dropdown[@name="queueTasks"]/parent::*/preceding-sibling::div[@class="info-circle"]//*[@class="small-text"]'
    );
  }

  definitionEditorSubmissionConfigTaskQueueToProcessDropdownInfoBoxCloseBtn() {
    return cy.xpath(
      '//goa-dropdown[@name="queueTasks"]/parent::*/preceding-sibling::*//*[@class="small-close-button"]'
    );
  }

  definitionsLoadMoreButton() {
    return cy.xpath('//goa-button[@data-testid="form-event-load-more-btn"]');
  }

  definitionsPage() {
    return cy.xpath('//div[@data-testid="form-templates"]');
  }

  definitionsEditorLifecycleApplicationItems() {
    return cy.xpath('//h3[text()="Application"]/following-sibling::div/goa-form-item');
  }

  definitionsEditorLifecycleSecurityClassificationDropdown() {
    return cy.xpath('//goa-dropdown[@name="securityClassifications"]');
  }

  definitionsEditorLifecycleSecurityClassificationDropdownItems() {
    return cy.xpath('//goa-dropdown[@name="securityClassifications"]/goa-dropdown-item');
  }

  definitionsEditorApplicantRole(serviceName, roleName) {
    return cy.xpath(
      `//h4/div[contains(text(),"${serviceName}")]/parent::h4/following-sibling::goa-table[1]//tbody/tr/td[1][text()="${roleName}"]/following-sibling::td[1]/goa-checkbox`
    );
  }

  formPreviewTextField(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]/goa-input[@type="text"]`);
  }

  formPreviewDateInput(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]/goa-input[@type="date"]`);
  }

  formPreviewDropdown(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//div[contains(@data-testid, "dropdown")]`);
  }

  formPreviewNextButton() {
    return cy.xpath('//goa-button[@data-testid="next-button"]');
  }

  formPreviewCheckbox(label) {
    return cy.xpath(`//goa-checkbox[@text="${label}"]`);
  }

  formPreviewSubmitButton() {
    return cy.xpath('//goa-button[@data-testid="stepper-submit-btn"]');
  }

  formPreviewListWithDetailButton(label) {
    return cy.xpath(`//goa-button[contains(@data-testid, "object-array-toolbar") and text()="${label}"]`);
  }

  formPreviewListWithDetailDependantTextField(label) {
    return cy.xpath(`//*[contains(@data-testid, "object-list-wrapper")]//goa-form-item[@label="${label}"]//goa-input`);
  }

  formPreviewListWithDetailDependantDateInput(label) {
    return cy.xpath(`//*[contains(@data-testid, "object-list-wrapper")]//goa-form-item[@label="${label}"]//goa-input`);
  }

  formPreviewRadioGroup(question) {
    return cy.xpath(`//goa-form-item[@label="${question}"]//goa-radio-group`);
  }

  formDataView() {
    return cy.xpath('//div[@data-testid="data-view"]');
  }

  formDataContent() {
    return cy.xpath('//div[@data-testid="data-view"]/div/div');
  }

  formPreviewView() {
    return cy.xpath(
      '//div[text()="Preview" and contains(@class, "active")]/parent::div/following-sibling::div[@data-testid="preview-view-tab"]'
    );
  }
}
export default FormPage;
