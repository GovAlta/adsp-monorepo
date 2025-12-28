class TaskPage {
  addQueueBtn() {
    return cy.get('goa-button:contains("Add queue")');
  }

  addQueueModalTitle() {
    return cy.xpath('//*[@testid="add-queue-modal" and @open="true"]').shadow().find('[data-testid="modal-title"]');
  }

  queueModalCancelButton() {
    return cy.get('[testid="queue-modal-cancel"]');
  }

  queueTable() {
    return cy.get('[data-testid="task-queue-table"]');
  }

  namespaceTextField() {
    return cy.xpath('//goa-input[@name="namespace"]');
  }

  nameTextField() {
    return cy.xpath('//goa-input[@name="name"]');
  }

  nameErrorMessage() {
    return cy.xpath('//label[text()="Name"]/parent::*/*[@class="error-msg"]');
  }

  nameFormItem() {
    return cy.xpath('//goa-form-item[@label="Name"]');
  }

  queueModalSaveButton() {
    return cy.xpath('//goa-button[@testid="queue-modal-save" and @disabled="false"]');
  }

  queueNamespaceValue() {
    return cy.get('[data-testid="queue-namespace"]');
  }

  queueNameValue() {
    return cy.get('[data-testid="queue-name"]');
  }

  queuePageSaveButton() {
    return cy.xpath('//*[@testid="queue-save" and @disabled="false"]');
  }

  queuePageBackButton() {
    return cy.xpath('//*[@testid="queue-cancel" and @disabled="false"]');
  }

  queuePageCheckboxesTables() {
    return cy.xpath('//*[@data-testid="queue-editor"]//goa-table');
  }

  queuePageClientRolesTable(clientName) {
    return cy.xpath(
      `//*[@data-testid="queue-editor"]//h4/div[text()="${clientName}"]/parent::h4/following-sibling::goa-table[1]`
    );
  }

  queuePageRolesTable() {
    return cy.xpath('//*[@data-testid="queue-editor"]//h4[text()="autotest"]/following-sibling::goa-table[1]');
  }

  queueTableBody() {
    return cy.xpath('//table[@data-testid="task-queue-table"]//tbody');
  }

  queueEditButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="task-queue-table"]//*[contains(@testid, "queue-definition-edit")])[${rowNumber}]`
    );
  }

  queueDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="task-queue-table"]//*[contains(@testid, "queue-definition-delete")])[${rowNumber}]`
    );
  }

  tasksSelectAQueueDropdown() {
    return cy.xpath('//goa-dropdown[@testid="task-select-definition-dropdown"]');
  }

  tasksTaskRecord(taskName, taskDescriptionKeyword) {
    return cy.xpath(
      `//table[@data-testid="task-task-table"]/tbody/tr/td[@data-testid="task-list-namespace" and text()="${taskName}"]/following-sibling::td[@data-testid="task-list-name" and contains(text(), "${taskDescriptionKeyword}")]`
    );
  }
}
export default TaskPage;
