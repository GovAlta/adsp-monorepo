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

  editorSaveButton() {
    return cy.xpath('//*[@data-testid="definition-form-save" and @disabled="false"]');
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
}
export default FormPage;
