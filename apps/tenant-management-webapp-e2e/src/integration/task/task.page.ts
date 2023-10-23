class TaskPage {
  addQueueBtn() {
    return cy.get('goa-button:contains("Add queue")');
  }

  addQueueModalTitle() {
    return cy.xpath('//*[@data-testid="add-queue-modal" and @data-state="visible"]//*[@class="modal-title"]');
  }

  queueModalCancelButton() {
    return cy.get('[data-testid="queue-modal-cancel"]');
  }

  queueTable() {
    return cy.get('[data-testid="task-queue-table"]');
  }

  namespaceTextField() {
    return cy.xpath(
      '//*[@class="goa-form-item"]/label[text()="Namespace"]/following-sibling::*[@class="goa-input"]/*[@data-testid="queue-modal-name-input"]'
    );
  }

  nameTextField() {
    return cy.xpath(
      '//*[contains(@class, "goa-form-item")]/label[text()="Name"]/following-sibling::*[@class="goa-input"]/*[@data-testid="queue-modal-name-input"]'
    );
  }

  nameErrorMessage() {
    return cy.xpath('//label[text()="Name"]/parent::*/*[@class="error-msg"]');
  }

  queueModalSaveButton() {
    return cy.xpath('//goa-button[text()="Save" and @disabled="false"]');
  }

  queueNamespaceValue() {
    return cy.get('[data-testid="queue-namespace"]');
  }

  queueNameValue() {
    return cy.get('[data-testid="queue-name"]');
  }

  queueSavebutton() {
    return cy.xpath('//*[@data-testid="form-save" and @disabled="false"]');
  }

  queuePageCheckboxesTables() {
    return cy.xpath('//*[@data-testid="template-form"]//goa-table');
  }

  queuePageClientRolesTable(clientName) {
    return cy.xpath(
      `//*[@data-testid="template-form"]//h4/div[text()="${clientName}"]/parent::h4/following-sibling::goa-table[1]`
    );
  }

  queuePageRolesTable() {
    return cy.xpath('//*[@data-testid="template-form"]//h4[text()="autotest"]/following-sibling::goa-table[1]');
  }

  // queuePageAssignerCheckbox(roleName) {
  //   return cy.xpath(
  //     `//*[@data-testid="template-form"]//td[text()="${roleName}"]/following-sibling::td//goa-checkbox[contains(@name, "Assigner roles")]`
  //   );
  // }

  // queuePageAssignerCheckboxes() {
  //   return cy.xpath('//*[@data-testid="template-form"]//goa-checkbox[contains(@name, "Assigner roles")]');
  // }

  // queuePageWorkerCheckbox(roleName) {
  //   return cy.xpath(
  //     `//*[@data-testid="template-form"]//td[text()="${roleName}"]/following-sibling::td//goa-checkbox[contains(@name, "Worker roles")]`
  //   );
  // }

  // queuePageWorkerCheckboxes() {
  //   return cy.xpath('//*[@data-testid="template-form"]//goa-checkbox[contains(@name, "Worker roles")]');
  // }
}
export default TaskPage;
