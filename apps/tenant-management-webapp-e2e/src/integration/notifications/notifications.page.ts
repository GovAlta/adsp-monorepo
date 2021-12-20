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

  notificationTypeEditBtn(notificationTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTitle}")]/following-sibling::*//*[@data-testid="icon-create"]`
    );
  }

  notificationTypeDeleteBtn(notificationTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTitle}")]/following-sibling::*//*[@data-testid="icon-trash"]`
    );
  }

  addANotificationTypeButtonOnNotificationTypesPage() {
    return cy.get('[data-testid="add-notification"]');
  }

  notificationTypeCardTitle(notificationTitle) {
    return cy.xpath(`//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTitle}")]`);
  }

  notificationTypeCardDesc(notificationTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTitle}")]//ancestor::*[@data-testid="card-title"]/following-sibling::*[@data-testid="card-content"]`
    );
  }

  notificationTypeSubscriberRoles(notificationTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTitle}")]/parent::*/following-sibling::*/div[contains(text(),  "Subscriber Roles")]`
    );
  }

  notificationTypePublicSubscription(notificationTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTitle}")]/parent::*/following-sibling::*/div[contains(text(), "Public Subscription")]`
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
}

export default notificationsPage;
