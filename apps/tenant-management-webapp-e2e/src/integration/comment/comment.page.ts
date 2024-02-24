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

  editorClassificationDropdown() {
    return cy.xpath('//goa-dropdown[@name="securityClassifications"]');
  }

  editorClassificationDropdownItems() {
    return cy.xpath('//goa-dropdown[@name="securityClassifications"]/goa-dropdown-item');
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
      `(//table[@data-testid="comment-topic-types-table"]//*[contains(@data-testid, "comment-topic-types-edit")])[${rowNumber}]`
    );
  }

  topicTypeDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="comment-topic-types-table"]//*[contains(@data-testid, "comment-topic-types-delete")])[${rowNumber}]`
    );
  }

  topicTypeEditorEditButton() {
    return cy.xpath('//*[@class="editColumn"]//*[text()="Edit"]');
  }

  topicTypeEditorEditTopicTypeModal() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="topicType-comment"]');
  }

  topicTypeEditorEditTopicTypeModalTitle() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="topicType-comment"]/*[@slot="heading"]');
  }

  topicTypeEditorEditTopicTypeModalNameInput() {
    return cy.xpath('//goa-input[@data-testid="comment-topicType-name"]');
  }

  topicTypeEditorEditTopicTypeModalSaveButton() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="topicType-comment"]//goa-button[text()="Save"]');
  }

  topicTypeEditorRolesTables() {
    return cy.xpath('//*[@data-testid="template-form"]//h4/following-sibling::goa-table[1]');
  }

  selectTopicTypeDropdown() {
    return cy.xpath('//goa-dropdown[@data-testid="comment-select-topic-type-dropdown"]');
  }

  topicTable() {
    return cy.xpath('//table[@data-testid="topic-table"]');
  }

  addTopicButton() {
    return cy.xpath('//goa-button[@data-testid="add-topic-btn"]');
  }

  addTopicModalHeading() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="add-topic-modal"]/div[@slot="heading"]');
  }

  addTopicModalName() {
    return cy.xpath('//goa-input[@data-testid="topic-modal-name-input"]');
  }

  addTopicModalDesc() {
    return cy.xpath('//goa-textarea[@data-testid="description"]');
  }

  addTopicModalResourceId() {
    return cy.xpath('//goa-input[@data-testid="topic-modal-resourceid-input"]');
  }

  addTopicModalSaveBtn() {
    return cy.xpath('//goa-modal[@data-testid="add-topic-modal"]//goa-button[text()="Save" and @disabled="false"]');
  }

  addTopicModalCancelBtn() {
    return cy.xpath('//goa-modal[@data-testid="add-topic-modal"]//goa-button[text()="Cancel" and @disabled="false"]');
  }

  topicLoadMoreButton() {
    return cy.xpath('//goa-button[text()="Load more"]');
  }

  topicTableRows() {
    return cy.xpath('//table[@data-testid="topic-table"]/tbody/tr');
  }

  topicTableBody() {
    return cy.xpath('//table[@data-testid="topic-table"]//tbody');
  }

  topicEyeIcon(rowNumber) {
    return cy.xpath(`//table[@data-testid="topic-table"]/tbody/tr[${rowNumber}]//goa-icon-button[@icon="eye"]`);
  }

  topicEyeOffIcon(rowNumber) {
    return cy.xpath(`//table[@data-testid="topic-table"]/tbody/tr[${rowNumber}]//goa-icon-button[@icon="eye-off"]`);
  }

  topicDeleteIcon(rowNumber) {
    return cy.xpath(`//table[@data-testid="topic-table"]/tbody/tr[${rowNumber}]//goa-icon-button[@icon="trash"]`);
  }

  // rowNumber is the description row number, which is the topic row number + 1
  topicDescription(rowNumber) {
    return cy.xpath(
      `//table[@data-testid="topic-table"]/tbody/tr[${rowNumber}]//p[text()="Topic description"]/following-sibling::span`
    );
  }

  topicDetailsNoCommentsFoundMessage(rowNumber) {
    return cy.xpath(
      `//table[@data-testid="topic-table"]/tbody/tr[${rowNumber}]//h3[text()="Comments list"]/parent::div/following-sibling::div//b[text()="No comments found"]`
    );
  }

  addCommentButton() {
    return cy.xpath('//goa-button[@data-testid="add-comment"]');
  }

  addCommentModalHeading() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="add-comment-modal"]/div[@slot="heading"]');
  }

  addCommentModalComment() {
    return cy.xpath('//goa-textarea[@data-testid="content"]');
  }

  addCommentModalSaveBtn() {
    return cy.xpath('//goa-modal[@data-testid="add-comment-modal"]//goa-button[text()="Save" and @disabled="false"]');
  }

  addCommentModalCancelBtn() {
    return cy.xpath('//goa-modal[@data-testid="add-comment-modal"]//goa-button[text()="Cancel" and @disabled="false"]');
  }

  commentContent(content) {
    return cy.xpath(`//div[contains(@data-testid, "comment-content") and text()="${content}"]`);
  }

  commentUser(content) {
    return cy.xpath(
      `//div[contains(@data-testid, "comment-content") and text()="${content}"]//preceding-sibling::div//div[contains(@data-testid, "updatedBy")]`
    );
  }

  commentDateTime(content) {
    return cy.xpath(
      `//div[contains(@data-testid, "comment-content") and text()="${content}"]//preceding-sibling::div//div[contains(@data-testid, "commentDate")]`
    );
  }

  commentsList() {
    return cy.xpath('//div[contains(@data-testid, "commentsList")]');
  }

  commentsListContents() {
    return cy.xpath('//div[contains(@data-testid, "comment-content")]');
  }

  commentEditIcon(rowNumber) {
    return cy.xpath(`(//goa-icon-button[@data-testid="comment-edit"])[${rowNumber}]`);
  }

  commentDeleteIcon(rowNumber) {
    return cy.xpath(`(//goa-icon-button[@data-testid="comment-delete"])[${rowNumber}]`);
  }

  editCommentModalHeading() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="edit-comment-modal"]/div[@slot="heading"]');
  }

  editCommentModalComment() {
    return cy.xpath('//goa-modal[@data-testid="edit-comment-modal"]//goa-textarea[@data-testid="content"]');
  }

  editCommentModalSaveBtn() {
    return cy.xpath('//goa-modal[@data-testid="edit-comment-modal"]//goa-button[text()="Save" and @disabled="false"]');
  }

  deleteCommentModalHeading() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="delete-confirmation"]/div[@slot="heading"]');
  }

  deleteCommentModalContent() {
    return cy.xpath(
      '//goa-modal[@open="true" and @data-testid="delete-confirmation"]/div[text()="Are you sure you wish to delete"]/div'
    );
  }

  deleteCommentModalDeleteBtn() {
    return cy.xpath(
      '//goa-modal[@open="true" and @data-testid="delete-confirmation"]//goa-button[@data-testid="delete-confirm"]'
    );
  }

  deleteTopicModalHeading() {
    return cy.xpath('//goa-modal[@open="true" and @data-testid="delete-confirmation"]/div[@slot="heading"]');
  }

  deleteTopicModalContentTopicName() {
    return cy.xpath(
      '//goa-modal[@open="true" and @data-testid="delete-confirmation"]/div/div[text()="Are you sure you wish to delete "]/b'
    );
  }

  deleteTopicModalContentNote() {
    return cy.xpath(
      '//goa-modal[@open="true" and @data-testid="delete-confirmation"]/div/div/div[contains(text(), "note")]'
    );
  }

  deleteTopicModalDeleteBtn() {
    return cy.xpath(
      '//goa-modal[@open="true" and @data-testid="delete-confirmation"]//goa-button[@data-testid="delete-confirm"]'
    );
  }

  commentsListViewOlderCommentsBtn() {
    return cy.xpath('//tbody//goa-button[@data-testid="comment-load-more-btn"]');
  }
}
export default CommentPage;
