class CommentPage {
  addTopicTypeBtn() {
    return cy.get('goa-button:contains("Add topic type")');
  }

  addTopicTypeModalTitle() {
    return cy.xpath('//*[@testid="topicType-comment" and @open="true"]').shadow().find('[data-testid="modal-title"]');
  }

  addTopicTypeModalCancelButton() {
    return cy.get('[testid="comment-cancel"]');
  }

  topicTypesTable() {
    return cy.get('[data-testid="comment-topic-types-table"]');
  }

  addTopicTypeNameTextField() {
    return cy.xpath('//goa-form-item[@label="Name"]/goa-input[@testid="comment-topicType-name"]');
  }

  nameFormItem() {
    return cy.xpath('//goa-form-item[@label="Name"]');
  }

  addTopicTypeModalSaveButton() {
    return cy.xpath('//goa-button[text()="Save"]').should('not.be.disabled');
    //return cy.xpath('//goa-button[text()="Save" and @disabled="false"]');
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
    return cy.xpath('//*[@testid="comment-save"]').should('not.be.disabled');
    // return cy.xpath('//*[@testid="comment-save" and @disabled="false"]');
  }

  editorBackButton() {
    return cy.xpath('//*[@testid="comment-cancel"]').should('not.be.disabled');
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
      `(//table[@data-testid="comment-topic-types-table"]//*[contains(@testid, "comment-topic-types-edit")])[${rowNumber}]`
    );
  }

  topicTypeDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="comment-topic-types-table"]//*[contains(@testid, "comment-topic-types-delete")])[${rowNumber}]`
    );
  }

  topicTypeEditorEditButton() {
    return cy.xpath('//*[@class="editColumn"]//*[text()="Edit"]');
  }

  topicTypeEditorEditTopicTypeModal() {
    return cy.xpath('//goa-modal[@open="true" and @testid="topicType-comment"]');
  }

  topicTypeEditorEditTopicTypeModalTitle() {
    return cy
      .xpath('//goa-modal[@open="true" and @testid="topicType-comment"]')
      .shadow()
      .find('[data-testid="modal-title"]');
  }

  topicTypeEditorEditTopicTypeModalNameInput() {
    return cy.xpath('//goa-input[@testid="comment-topicType-name"]');
  }

  topicTypeEditorEditTopicTypeModalSaveButton() {
    return cy.xpath('//goa-modal[@open="true" and @testid="topicType-comment"]//goa-button[text()="Save"]');
  }

  topicTypeEditorRolesTables() {
    return cy.xpath('//*[@data-testid="template-form"]//h4/following-sibling::goa-table[1]');
  }

  selectTopicTypeDropdown() {
    return cy.xpath('//goa-dropdown[@testid="comment-select-topic-type-dropdown"]');
  }

  topicTable() {
    return cy.xpath('//table[@data-testid="topic-table"]');
  }

  addTopicButton() {
    return cy.xpath('//goa-button[@testid="add-topic-btn"]');
  }

  addTopicModalHeading() {
    return cy
      .xpath('//goa-modal[@open="true" and @testid="add-topic-modal"]')
      .shadow()
      .find('[data-testid="modal-title"]');
  }

  addTopicModalName() {
    return cy.xpath('//goa-input[@testid="topic-modal-name-input"]');
  }

  addTopicModalDesc() {
    return cy.xpath('//goa-textarea[@testid="description"]');
  }

  addTopicModalResourceId() {
    return cy.xpath('//goa-input[@testid="topic-modal-resourceid-input"]');
  }

  addTopicModalSaveBtn() {
    return cy.get('goa-modal[testid="add-topic-modal"]').find('goa-button').contains('Save').should('not.be.disabled');
  }

  addTopicModalCancelBtn() {
    return cy
      .get('goa-modal[testid="add-topic-modal"]')
      .find('goa-button')
      .contains('Cancel')
      .should('not.be.disabled');
    // return cy.xpath('//goa-modal[@testid="add-topic-modal"]//goa-button[text()="Cancel" and @disabled="false"]');
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
    return cy.xpath('//goa-button[@testid="add-comment"]');
  }

  addCommentModalHeading() {
    return cy
      .xpath('//goa-modal[@open="true" and @testid="add-comment-modal"]')
      .shadow()
      .find('[data-testid="modal-title"]');
  }

  addCommentModalComment() {
    return cy.xpath('//goa-textarea[@testid="content"]');
  }

  addCommentModalSaveBtn() {
    return cy.xpath('//goa-modal[@testid="add-comment-modal"]//goa-button[text()="Save"]');
    // return cy.xpath('//goa-modal[@testid="add-comment-modal"]//goa-button[text()="Save" and @disabled="false"]');
  }

  addCommentModalCancelBtn() {
    return cy.xpath('//goa-modal[@testid="add-comment-modal"]//goa-button[text()="Cancel"]');
    // return cy.xpath('//goa-modal[@testid="add-comment-modal"]//goa-button[text()="Cancel" and @disabled="false"]');
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
    return cy.xpath(`(//goa-icon-button[@testid="comment-edit"])[${rowNumber}]`);
  }

  commentDeleteIcon(rowNumber) {
    return cy.xpath(`(//goa-icon-button[@testid="comment-delete"])[${rowNumber}]`);
  }

  editCommentModalHeading() {
    return cy
      .xpath('//goa-modal[@open="true" and @testid="edit-comment-modal"]')
      .shadow()
      .find('[data-testid="modal-title"]');
  }

  editCommentModalComment() {
    return cy.xpath('//goa-modal[@testid="edit-comment-modal"]//goa-textarea[@testid="content"]');
  }

  editCommentModalSaveBtn() {
    return cy.xpath('//goa-modal[@testid="edit-comment-modal"]//goa-button[text()="Save"]');
    //  return cy.xpath('//goa-modal[@testid="edit-comment-modal"]//goa-button[text()="Save" and @disabled="false"]');
  }

  deleteCommentModalHeading() {
    return cy
      .xpath('//goa-modal[@open="true" and @testid="delete-confirmation"]')
      .shadow()
      .find('[data-testid="modal-title"]');
  }

  deleteCommentModalContent() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="delete-confirmation"]/div[text()="Are you sure you wish to delete"]/div'
    );
  }

  deleteCommentModalDeleteBtn() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="delete-confirmation"]//goa-button[@testid="delete-confirm"]'
    );
  }

  deleteTopicModalHeading() {
    return cy
      .xpath('//goa-modal[@open="true" and @testid="delete-confirmation"]')
      .shadow()
      .find('[data-testid="modal-title"]');
  }

  deleteTopicModalContentTopicName() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="delete-confirmation"]/div/div[text()="Are you sure you wish to delete "]/b'
    );
  }

  deleteTopicTypeModalHeading() {
    return cy
      .xpath('//goa-modal[@open="true" and @testid="delete-confirmation"]')
      .shadow()
      .find('[data-testid="modal-title"]');
  }

  deleteTopicTypeModalContentTopicName() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="delete-confirmation"]/div[text()="Are you sure you wish to delete "]/b'
    );
  }

  deleteTopicModalContentNote() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="delete-confirmation"]/div/div/div[contains(text(), "note")]'
    );
  }

  deleteTopicModalDeleteBtn() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="delete-confirmation"]//goa-button[@testid="delete-confirm"]'
    );
  }

  commentsListViewOlderCommentsBtn() {
    return cy.xpath('//tbody//goa-button[@testid="comment-load-more-btn"]');
  }

  topicTypesCoreTypesTitleAfterTopicTypeTable() {
    return cy.xpath(
      '//*[@data-testid="comment-topic-types-table"]/parent::div/following-sibling::h2[text()="Core types"]'
    );
  }

  topicTypesCoreTypesTableTitles() {
    return cy.xpath('//*[@data-testid="comment-core-topic-types-table"]/thead/tr/th');
  }

  topicTypesCoreTypesTableRows() {
    return cy.xpath('//*[@data-testid="comment-core-topic-types-table"]/tbody/tr');
  }

  commentsTab() {
    return cy.xpath('//*[@data-testid="comments-tab"]');
  }
}
export default CommentPage;
