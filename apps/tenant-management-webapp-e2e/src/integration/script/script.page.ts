class ScriptPage {
  addScriptBtn() {
    return cy.get('[data-testid="add-script-btn"]');
  }

  addScriptModalTitle() {
    return cy.xpath('//div[@data-testid="add-script-modal" and @data-state="visible"]//div[@class="modal-title"]');
  }

  scriptModalNameField() {
    return cy.get('[data-testid="script-modal-name-input"]');
  }

  scriptModalNameErrorMsg() {
    return cy.xpath(
      '//*[@data-testid="add-script-modal"]//label[text()="Name"]/following-sibling::div[@class="error-msg"]'
    );
  }

  scriptModalDescriptionField() {
    return cy.get('[data-testid="script-modal-description-input"]');
  }

  scriptModalUseServiceAccountCheckbox() {
    return cy.xpath(
      '//input[@name="script-use-service-account-checkbox"]/parent::div[@class="goa-checkbox-container"]'
    );
  }

  scriptModalRolesCheckbox(roleName) {
    return cy.xpath(
      `//*[@data-testid="add-script-modal"]//td[text()="${roleName}"]/following-sibling::td//input[contains(@name, "runner")]/parent::*[contains(@class, "goa-checkbox-container")]`
    );
  }

  scriptModalSaveButton() {
    return cy.get('[data-testid="script-modal-save"]');
  }

  scriptTableBody() {
    return cy.xpath('//table[@data-testid="script-table"]//tbody');
  }

  scriptDeleteButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="script-table"]//*[contains(@data-testid, "icon-trash")])[${rowNumber}]`);
  }
}
export default ScriptPage;
