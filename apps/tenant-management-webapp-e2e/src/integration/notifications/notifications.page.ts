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

  notificationTypeSelectAnEventModal() {
    return cy.xpath('//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]');
  }

  notificationTypeSelectAnEventModalTitle() {
    return cy.xpath(
      '//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@class="modal-title"]'
    );
  }

  notificationTypeSelectAnEventModalEventDropdown() {
    return cy.xpath(
      '//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@data-testid="event-dropdown"]'
    );
  }

  notificationTypeSelectAnEventModalEventDropdownItem(text) {
    return cy.xpath(
      `//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@data-testid="event-dropdown"]/following-sibling::*//*[contains(text(), "${text}")]`
    );
  }

  notificationTypeEvents(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]//ancestor::*[@class="card-content"]//*[@data-testid="card-footer"]//*[@class="flex1"]`
    );
  }
}

export default notificationsPage;
