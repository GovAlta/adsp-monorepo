class NotificationsPage {
  addANotificationTypeButtonOnOverview() {
    return cy.get('[data-testid="add-notification-overview"]');
  }

  notificationTypeModal() {
    return cy.xpath('//*[@data-testid="notification-types-form" and @data-state="visible"]/*[@class="modal"]');
  }

  notificationTypeModalTitle() {
    return cy.xpath(
      '//*[@data-testid="notification-types-form" and @data-state="visible"]/*[@class="modal"]//*[@class="modal-title"]'
    );
  }

  notificationTypeModalNameField() {
    return cy.get('[data-testid="form-name"]');
  }

  notificationTypeModalDescriptionField() {
    return cy.get('[data-testid="form-description"]');
  }

  notificationTypeModalSubscriberRolesDropdown() {
    return cy.get('[data-testid="subscriberRoles-dropdown"]');
  }

  notificationTypeModalSubscriberRolesDropdownItem(text) {
    return cy.xpath(
      `//*[@data-testid="subscriberRoles-dropdown"]/following-sibling::*//*[contains(text(), "${text}")]`
    );
  }

  notificationTypeModalSubscriberRolesDropdownBackground() {
    return cy.get('[data-testid="subscriberRoles-dropdown-background"]');
  }

  notificationTypeModalSaveBtn() {
    return cy.get('[data-testid="form-save"]');
  }

  notificationTypeEditBtn(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]/following-sibling::*//*[@data-testid="edit-notification-type"]`
    );
  }

  notificationTypeDeleteBtn(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]/following-sibling::*//*[@data-testid="icon-trash"]`
    );
  }

  addANotificationTypeButtonOnNotificationTypesPage() {
    return cy.get('[data-testid="add-notification"]');
  }

  notificationTypeCardTitle(notificationTypeTitle) {
    return cy.xpath(`//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]`);
  }

  notificationTypeCardDesc(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]//ancestor::*[@data-testid="card-title"]/following-sibling::*[@data-testid="card-content"]`
    );
  }

  notificationTypeSubscriberRoles(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*/div[contains(text(),  "Subscriber Roles")]`
    );
  }

  notificationTypePublicSubscription(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*/div[contains(text(), "Public Subscription")]`
    );
  }

  notificationTypeDeleteConfirmationModalTitle() {
    return cy.xpath(
      '//*[@data-testid="delete-confirmation" and @data-state="visible"]/*[@class="modal"]//*[@class="modal-title"]'
    );
  }

  notificationTypeDeleteConfirmationModal() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]/*[@class="modal"]');
  }

  notificationTypeDeleteConfirmationModalConfirmBtn() {
    return cy.get('[data-testid="delete-confirm"]');
  }

  notificationTypeSelectAnEventBtn(cardTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${cardTitle}")]//ancestor::*[@class="card-content"]//button[contains(text(), "Select an event")]`
    );
  }

  selectAnEventModalTitle() {
    return cy.xpath(
      '//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@class="modal-title"]'
    );
  }

  selectAnEventModalEventDropdown() {
    return cy.xpath(
      '//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@data-testid="event-dropdown"]'
    );
  }

  selectAnEventModalEventDropdownItem(text) {
    return cy.xpath(
      `//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@data-testid="event-dropdown"]/following-sibling::*//*[contains(text(), "${text}")]`
    );
  }

  selectAnEventModalNextBtn() {
    return cy.get('[data-testid="event-form-save"]');
  }

  selectAnEventModalCancelBtn() {
    return cy.get('[data-testid="event-form-cancel"]');
  }

  addAnEmailTemplateModalTitle() {
    return cy.xpath(
      '//*[@data-testid="template-form" and @data-state="visible"]/*[@class="modal"]//*[@class="modal-title"]'
    );
  }

  addAnEmailTemplateModalSubject() {
    return cy.xpath(
      '(//*[@data-testid="template-form" and @data-state="visible"]//*[@class="monaco-scrollable-element editor-scrollable vs"])[1]'
    );
  }

  addAnEmailTemplateModalBody() {
    return cy.xpath(
      '(//*[@data-testid="template-form" and @data-state="visible"]//*[@class="monaco-scrollable-element editor-scrollable vs"])[2]'
    );
  }

  addAnEmailTemplateModalAddBtn() {
    return cy.get('[data-testid="template-form-save"]');
  }

  notificationTypeEvents(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]//ancestor::*[@class="card-content"]//*[@data-testid="card-footer"]//*[@class="flex1"]`
    );
  }

  eventDeleteIcon(cardTitle, eventName) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${cardTitle}")]//ancestor::*[@class="card-content"]/*[@data-testid="card-footer"]//*[@class="flex1" and contains(., "${eventName}")]/following-sibling::*[@class="rowFlex"]//*[@data-testid="icon-trash"]`
    );
  }

  removeEventModalTitle() {
    return cy.xpath(
      '//*[@data-testid="event-delete-confirmation" and @data-state="visible"]/*[@class="modal"]//*[@class="modal-title"]'
    );
  }

  removeEventModalContent() {
    return cy.xpath(
      '//*[@data-testid="event-delete-confirmation" and @data-state="visible"]/*[@class="modal"]//*[@class="goa-scrollable"]'
    );
  }

  removeEventModalConfirmBtn() {
    return cy.get('[data-testid="event-delete-confirm"]');
  }

  // Internal notification type card elements have different xpath than those from custom created notification type cards, so use "Internal" prefix for the following several UI page object names
  internalNotificationTypeEventMailIcon(cardTitle, eventName) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${cardTitle}")]//ancestor::*[@class="card-content"]/*[@data-testid="card-footer"]//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="icon-mail"]`
    );
  }

  internalNotificationTypeEventPreviewLink(cardTitle, eventName) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${cardTitle}")]//ancestor::*[@class="card-content"]/*[@data-testid="card-footer"]//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="preview-event"]`
    );
  }

  internalNotificationTypeEventEditButton(cardTitle, eventName) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${cardTitle}")]//ancestor::*[@class="card-content"]/*[@data-testid="card-footer"]//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="edit-event"]`
    );
  }

  eventTemplatePreviewModal() {
    return cy.xpath('//*[@data-testid="template-form" and @data-state="visible"]');
  }

  eventTemplatePreviewModalTitle() {
    return cy.xpath('//*[@data-testid="email-preview" and @data-state="visible"]//*[@class="modal-title"]');
  }

  eventTemplatePreviewModalSubjectEditor() {
    return cy.xpath(
      '(//*[@data-testid="template-form" and @data-state="visible"]//*[@class="goa-form-item"]//*[contains(@class, "monaco-editor") and @role="code"])[1]'
    );
  }

  eventTemplatePreviewModalBodyEditor() {
    return cy.xpath(
      '(//*[@data-testid="template-form" and @data-state="visible"]//*[@class="goa-form-item"]//*[contains(@class, "monaco-editor") and @role="code"])[2]'
    );
  }

  eventTemplatePreviewModalCloseBtn() {
    return cy.xpath('//*[@data-testid="email-preview" and @data-state="visible"]//*[@data-testid="preview-cancel"]');
  }
  //LD
  notificationsTab(text) {
    return cy.xpath(
      `//h1[contains(text(), "Notifications")]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
    );
  }
}

export default NotificationsPage;
