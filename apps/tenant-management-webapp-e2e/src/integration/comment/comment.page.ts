class CommentPage {
  addTopicTypeBtn() {
    return cy.get('goa-button:contains("Add topic type")');
  }

  addTopicTypeModalTitle() {
    return cy.xpath('//*[@data-testid="topicType-comment" and @open="true"]//*[@slot="heading"]');
  }

  addTopicTypeModalCancelButton() {
    return cy.get('[data-testid="comment-cancel"]');
  }

  topicTypesTable() {
    return cy.get('[data-testid="comment-topic-types-table"]');
  }

  addTopicTypeNameTextField() {
    return cy.xpath('//goa-form-item[@label="Name"]/goa-input[@data-testid="comment-topicType-name"]');
  }

  nameFormItem() {
    return cy.xpath('//goa-form-item[@label="Name"]');
  }

  addTopicTypeModalSaveButton() {
    return cy.xpath('//goa-button[text()="Save" and @disabled="false"]');
  }

  editorTopicTypeNameValue() {
    return cy.get('[data-testid="template-name"]');
  }

  editorSaveButton() {
    return cy.xpath('//*[@data-testid="comment-save" and @disabled="false"]');
  }

  editorBackButton() {
    return cy.xpath('//*[@data-testid="comment-cancel" and @disabled="false"]');
  }

  editorCheckboxesTables() {
    return cy.xpath('//*[text()="Roles"]/parent::*//goa-table');
  }

  editorClientRolesTable(clientName) {
    return cy.xpath(
      `//*[text()="Roles"]/parent::*//h4/div[text()="${clientName}"]/parent::h4/following-sibling::goa-table[1]`
    );
  }

  editorRolesTable() {
    return cy.xpath('//*[text()="Roles"]/parent::*//h4[text()="autotest"]/following-sibling::goa-table[1]');
  }

  topicTypesTableBody() {
    return cy.xpath('//table[@data-testid="comment-topic-types-table"]//tbody');
  }

  topicTypeEditButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="comment-topic-types-table"]//*[contains(@data-testid, "comment-definition-edit")])[${rowNumber}]`
    );
  }

  topicTypeDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="comment-topic-types-table"]//*[contains(@data-testid, "comment-definition-delete")])[${rowNumber}]`
    );
  }
}
export default CommentPage;
