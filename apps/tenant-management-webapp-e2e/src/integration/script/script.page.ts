class ScriptPage {
  addScriptBtn() {
    return cy.get('[data-testid="add-script-btn"]');
  }

  addScriptModalTitle() {
    return cy.xpath('//goa-modal[@data-testid="add-script-modal" and @open="true"]//*[@slot="heading"]');
  }

  addScriptModalNameFormItem() {
    return cy.xpath('//goa-modal[@data-testid="add-script-modal" and @open="true"]//*[@label="Name"]');
  }

  addScriptModalNameField() {
    return cy.xpath(
      '//goa-modal[@data-testid="add-script-modal" and @open="true"]//*[@data-testid="script-modal-name-input"]'
    );
  }

  addScriptModalNameErrorMsg() {
    return cy.xpath(
      '//goa-modal[@data-testid="add-script-modal" and @open="true"]//label[text()="Name"]/following-sibling::div[@class="error-msg"]'
    );
  }

  addScriptModalDescriptionField() {
    return cy.xpath(
      '//goa-modal[@data-testid="add-script-modal" and @open="true"]//*[@data-testid="script-modal-description-input"]'
    );
  }

  addScriptModalUseServiceAccountCheckbox() {
    return cy.xpath('//goa-checkbox[@name="script-use-service-account-checkbox"]');
  }

  addScriptModalRolesCheckbox(roleName) {
    return cy.xpath(
      `//*[@data-testid="add-script-modal"]//td[text()="${roleName}"]/following-sibling::td//goa-checkbox[contains(@name, "runner")]`
    );
  }

  addScriptModalRolesTitle(roleTitle) {
    return cy.xpath(`//*[@data-testid="add-script-modal"]//h4[text()="${roleTitle}"]`);
  }

  addScriptModalClientRolesTable(clientName) {
    return cy.xpath(
      `//*[@data-testid="add-script-modal" and @open="true"]//h4/div[text()="${clientName}"]/parent::h4/following-sibling::goa-table`
    );
  }

  addScriptModalRolesTable() {
    return cy.xpath(
      `//*[@data-testid="add-script-modal" and @open="true"]//h4/div[text()="autotest"]/parent::h4/following-sibling::goa-table`
    );
  }

  scriptModalSaveButton() {
    return cy.get('[data-testid="script-modal-save"]');
  }

  scriptModalCancelButton() {
    return cy.get('[data-testid="script-modal-cancel"]');
  }

  scriptTableBody() {
    return cy.xpath('//table[@data-testid="script-table"]//tbody');
  }

  scriptDeleteButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="script-table"]//*[contains(@data-testid, "delete-icon")])[${rowNumber}]`);
  }

  scriptEditButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="script-table"]//*[contains(@data-testid, "script-edit")])[${rowNumber}]`);
  }

  editScriptModal() {
    return cy.xpath('//*[@data-testid="script-edit-form" and @open]');
  }

  editScriptModalSaveBtn() {
    return cy.xpath(
      '//*[@data-testid="script-edit-form" and @open]//goa-button[@data-testid="template-form-save" and @type="primary"]'
    );
  }

  editScriptModalNameField() {
    return cy.xpath('//*[@data-testid="script-edit-form" and @open]//*[@data-testid="script-modal-name-input"]');
  }

  editScriptModalDescriptionField() {
    return cy.xpath('//*[@data-testid="script-edit-form" and @open]//*[@data-testid="script-modal-description-input"]');
  }

  editScriptModalLuaScriptEditor() {
    return cy.xpath(
      '//*[@data-testid="script-edit-form" and @open]//*[@data-testid="templated-editor-body"]//*[contains(@class, "monaco-editor") and @role="code"]//div[@class="monaco-scrollable-element editor-scrollable vs"]/following-sibling::textarea'
    );
  }
}
export default ScriptPage;
