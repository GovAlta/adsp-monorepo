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
      '//*[@class="goa-form-item"]/label[text()="Namespace"]/following-sibling::*[@class="goa-input"]/*[@data-testid="queue-modal-namespace-input"]'
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

  queuePageSaveButton() {
    return cy.xpath('//*[@data-testid="queue-save" and @disabled="false"]');
  }

  queuePageBackButton() {
    return cy.xpath('//*[@data-testid="queue-cancel" and @disabled="false"]');
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
      `(//table[@data-testid="task-queue-table"]//*[contains(@data-testid, "task-definition-edit")])[${rowNumber}]`
    );
  }

  queueDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="task-queue-table"]//*[contains(@data-testid, "task-definition-delete")])[${rowNumber}]`
    );
  }
}
export default TaskPage;
