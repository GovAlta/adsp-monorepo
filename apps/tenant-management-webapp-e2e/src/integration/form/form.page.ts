class FormPage {
  addDefinitionBtn() {
    return cy.get('goa-button:contains("Add definition")');
  }

  addDefinitionModalTitle() {
    return cy.xpath('//*[@testid="definition-form" and @open="true"]/*[@slot="heading"]');
  }

  addDefinitionModalCancelButton() {
    return cy.get('[testid="add-edit-form-cancel"]');
  }

  definitionTable() {
    return cy.get('[data-testid="form-definitions-table"]');
  }

  addDefinitionNameTextField() {
    return cy.xpath('//goa-form-item[@label="Name"]/goa-input[@testid="form-definition-name"]');
  }

  addDefinitionDescriptionField() {
    return cy.xpath('//goa-form-item[@label="Description"]//goa-textarea[@testid="form-definition-description"]');
  }

  nameFormItem() {
    return cy.xpath('//goa-form-item[@label="Name"]');
  }

  addDefinitionModalSaveButton() {
    return cy.xpath(
      '//goa-modal[@testid="definition-form" and @open="true"]/div[@slot="actions"]/goa-button-group/goa-button[text()="Save" and @disabled="false"]'
    );
  }

  editorDefinitionNameValue() {
    return cy.get('[data-testid="template-name"]');
  }

  editorDefinitionDescriptionValue() {
    return cy.get('[data-testid="template-description"]');
  }

  editorSaveButtonEnabled() {
    return cy.xpath('//*[@testid="definition-form-save" and @disabled="false"]');
  }

  editorSaveButton() {
    return cy.xpath('//*[@testid="definition-form-save"]');
  }

  editorBackButton() {
    return cy.xpath('//*[@testid="form-editor-cancel" and @disabled="false"]');
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

  definitionsEditButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="form-definitions-table"]//*[contains(@testid, "form-definition-edit")])[${rowNumber}]`
    );
  }

  definitionsDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="form-definitions-table"]//*[contains(@testid, "form-definition-delete")])[${rowNumber}]`
    );
  }

  definitionsAddTagsButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="form-definitions-table"]//*[contains(@testid, "form-definition-resource-tag-edit")])[${rowNumber}]`
    );
  }

  definitionsDetailsButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="form-definitions-table"]//*[contains(@testid, "form-toggle-details-visibility")])[${rowNumber}]`
    );
  }

  definitionEditorTab(tabName) {
    return cy.xpath(`//*[contains(@data-testid, "tab") and text()="${tabName}"]`);
  }

  definitionEditorEditButton() {
    return cy.xpath('//*[@class="editColumn"]//*[text()="Edit"]');
  }

  definitionEditorEditDefinitionModal() {
    return cy.xpath('//goa-modal[@open="true" and @testid="definition-form"]');
  }

  definitionEditorEditDefinitionModalTitle() {
    return cy.xpath('//goa-modal[@open="true" and @testid="definition-form"]/*[@slot="heading"]');
  }

  definitionEditorEditDefinitionModalNameInput() {
    return cy.xpath('//goa-input[@testid="form-definition-name"]');
  }

  definitionEditorEditDefinitionModalDescriptionField() {
    return cy.xpath('//goa-textarea[@testid="form-definition-description"]');
  }

  definitionEditorEditDefinitionModalSaveButton() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="definition-form"]/div[@slot="actions"]/goa-button-group/goa-button[text()="Save"]'
    );
  }

  definitionEditorRolesTables() {
    return cy.xpath('//*[@data-testid="form-roles-tab"]//h4/following-sibling::goa-table[1]');
  }

  definitionEditorSubmissionConfigSubmission() {
    return cy.xpath('//*[@data-testid="lifecycle"]');
  }

  definitionEditorSubmissionConfigSubmissionRecordCheckbox() {
    return cy.xpath('//*[@data-testid="lifecycle"]//goa-checkbox[@testid="submission-records"]');
  }

  definitionEditorSubmissionConfigSubmissionRecordCheckboxInfoCircle() {
    return cy.xpath(
      '//*[@data-testid="lifecycle"]//goa-checkbox[@testid="submission-records"]/parent::*/following-sibling::goa-tooltip'
    );
  }

  definitionEditorSubmissionConfigAddStateBtn() {
    return cy.xpath('//goa-button[@testid="Add state"]');
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
    return cy.xpath('//goa-modal[@open="true"]//goa-button[@testid="disposition-state-save"]');
  }

  definitionEditorSubmissionConfigEditDispositionStateModalCancelBtn() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[@testid="disposition-state-cancel-edit"]');
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
    return cy.xpath(
      '//*[@data-testid="lifecycle"]//h3[text()="Task queue to process"]/following-sibling::*[1]//goa-tooltip'
    );
  }

  definitionsLoadMoreButton() {
    return cy.xpath('//goa-button[@testid="form-event-load-more-btn"]');
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
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-input[@type="text"]`);
  }

  formPreviewDateInput(label) {
    return cy.xpath(`//goa-form-item[@label="${label} "]//goa-input[@type="date"]`);
  }

  formPreviewDropdown(label) {
    return cy.xpath(`//goa-form-item[@label="${label} "]//div[contains(@data-testid, "dropdown")]`);
  }

  formPreviewNextButton() {
    return cy.xpath('//goa-button[@testid="next-button"]');
  }

  formPreviewCheckbox(label) {
    return cy.xpath(`//goa-checkbox[@text="${label}"]`);
  }

  formPreviewSubmitButton() {
    return cy.xpath('//goa-button[@testid="stepper-submit-btn"]');
  }

  formPreviewListWithDetailButton(label) {
    return cy.xpath(`//goa-button[contains(@testid, "object-array-toolbar") and text()="${label}"]`);
  }

  formPreviewListWithDetailDependantTextField(label) {
    return cy.xpath(
      `//*[contains(@data-testid, "object-list-wrapper")]//goa-form-item[contains(@label, "${label}")]//goa-input`
    );
  }

  formPreviewListWithDetailDependantDateInput(label) {
    return cy.xpath(
      `//*[contains(@data-testid, "object-list-wrapper")]//goa-form-item[contains(@label, "${label}")]//goa-input`
    );
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

  formEditorCircularProgress() {
    return cy.xpath('//goa-circular-progress[@visible="true"]');
  }

  formSuccessCallout() {
    return cy.xpath('//goa-callout[@type="success"]');
  }

  definitionsAddTagsModal() {
    return cy.xpath('//goa-modal[@open="true" and @testid="add-resource-tag-model"]');
  }

  definitionsAddTagsModalTitle() {
    return cy.xpath('//goa-modal[@open="true" and @testid="add-resource-tag-model"]/div[@slot="heading"]');
  }

  definitionsAddTagsModalDesc() {
    return cy.xpath('//goa-modal[@open="true" and @testid="add-resource-tag-model"]/div[contains(@class, "sc")]');
  }

  definitionsAddTagsModalTagField() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="add-resource-tag-model"]//goa-input[@testid="add-resource-tag-name"]'
    );
  }

  definitionsAddTagsModalFormItem() {
    return cy.xpath('//goa-modal[@open="true" and @testid="add-resource-tag-model"]//goa-form-item');
  }

  definitionsAddTagsModalCloseBtn() {
    return cy.xpath('//goa-modal[@open="true" and @testid="add-resource-tag-model"]//goa-button[text()="Close"]');
  }

  definitionsAddTagsModalCreateAndAddTagBtn() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="add-resource-tag-model"]//goa-button[text()="Create and add tag"]'
    );
  }

  definitionsAddTagsModalAddTagBtn() {
    return cy.xpath('//goa-modal[@open="true" and @testid="add-resource-tag-model"]//goa-button[text()="Add tag"]');
  }

  definitionsAddTagsModalTagChips() {
    return cy.xpath('//goa-modal[@open="true" and @testid="add-resource-tag-model"]//goa-filter-chip');
  }

  definitionsDetailsLoadingIndicator() {
    return cy.xpath('//*[@data-testid="configuration-details"]//goa-circular-progress[@visible="true"]');
  }

  definitionsDetails() {
    return cy.xpath('//*[@data-testid="configuration-details"]');
  }

  definitionsDetailsTags() {
    return cy.xpath('//*[@data-testid="configuration-details"]//goa-badge');
  }

  definitionsDetailsDefinitionID() {
    return cy.xpath('//*[@data-testid="configuration-details"]//div[text()="Definition ID"]/following-sibling::text()');
  }

  definitionsFilterByTagDropdown() {
    return cy.xpath('//goa-dropdown[@name="TagFilter"]');
  }
}
export default FormPage;
