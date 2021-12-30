class notificationsPage {
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
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]/following-sibling::*//*[@data-testid="icon-create"]`
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

  NotificationTypeSelectAnEventBtn(cardTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${cardTitle}")]//ancestor::*[@class="card-content"]//button[contains(text(), "Select an event")]`
    );
  }

  SelectAnEventModalTitle() {
    return cy.xpath(
      '//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@class="modal-title"]'
    );
  }

  SelectAnEventModalEventDropdown() {
    return cy.xpath(
      '//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@data-testid="event-dropdown"]'
    );
  }

  SelectAnEventModalEventDropdownItem(text) {
    return cy.xpath(
      `//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@data-testid="event-dropdown"]/following-sibling::*//*[contains(text(), "${text}")]`
    );
  }

  SelectAnEventModalNextBtn() {
    return cy.get('[data-testid="event-form-save"]');
  }

  SelectAnEventModalCancelBtn() {
    return cy.get('[data-testid="event-form-cancel"]');
  }

  AddAnEmailTemplateModalTitle() {
    return cy.xpath(
      '//*[@data-testid="template-form" and @data-state="visible"]/*[@class="modal"]//*[@class="modal-title"]'
    );
  }

  AddAnEmailTemplateModalSubject() {
    return cy.xpath(
      '//*[@data-testid="template-form" and @data-state="visible"]//label[contains(text(), "Subject")]/parent::div[@class="goa-form-item"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  AddAnEmailTemplateModalBody() {
    return cy.xpath(
      '//*[@data-testid="template-form" and @data-state="visible"]//label[contains(text(), "Body")]/parent::div[@class="goa-form-item"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  AddAnEmailTemplateModalAddBtn() {
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
}

export default notificationsPage;
