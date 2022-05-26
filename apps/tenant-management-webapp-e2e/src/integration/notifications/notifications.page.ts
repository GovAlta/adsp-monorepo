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

  notificationChannelCheckbox(channelName) {
    return cy.xpath(
      `//*[@class="modal"]//input[@name="${channelName}"]/parent::*[contains(@class, "goa-checkbox-container")]`
    );
  }

  notificationTypeModalSelfServiceCheckbox() {
    return cy.xpath(
      '//*[@data-testid="manage-subscriptions-checkbox-wrapper"]//div[contains(@class, "goa-checkbox-container")]'
    );
  }

  notificationTypeModalSelfServiceCalloutContent() {
    return cy.xpath('//*[@data-testid="callout-content"]');
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
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*//*[@data-testid="tenant-subscriber-roles"]`
    );
  }

  notificationTypePublicSubscription(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*//*[@data-testid="tenant-public-subscription"]`
    );
  }

  notificationTypeSelfService(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*//*[@data-testid="tenant-self-service"]`
    );
  }

  notificationTypeCoreSelfService(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*//*[@data-testid="core-self-service"]`
    );
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
    return cy.xpath('//*[@data-testid="template-form"]//*[@data-testid="modal-title"]');
  }

  addAnEmailTemplateModalSubject() {
    return cy.xpath(
      '(//*[@data-testid="template-form"]//*[@class="monaco-scrollable-element editor-scrollable vs"])[1]'
    );
  }

  addAnEmailTemplateModalBody() {
    return cy.xpath(
      '(//*[@data-testid="template-form"]//*[@class="monaco-scrollable-element editor-scrollable vs"])[2]'
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

  notificationTypeCardFooterItems(notificationTypeTitle) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${notificationTypeTitle}")]//ancestor::*[@class="card-content"]//*[@data-testid="card-footer"]/div/div`
    );
  }

  eventDeleteIcon(cardTitle, eventName) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${cardTitle}")]//ancestor::*[@class="card-content"]/*[@data-testid="card-footer"]//*[@class="flex1" and contains(., "${eventName}")]/following-sibling::*[@class="rowFlex"]//*[@data-testid="icon-trash"]`
    );
  }

  // Internal notification type card elements have different xpath than those from custom created notification type cards, so use "Internal" prefix for the following several UI page object names
  internalNotificationTypeEventMailIcon(cardTitle, eventName) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${cardTitle}")]//ancestor::*[@class="card-content"]/*[@data-testid="card-footer"]//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="core-email-channel"]`
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

  searchSubscriberAddressAs() {
    return cy.xpath('//input[@id="name"]');
  }

  searchSubscriberEmail() {
    return cy.xpath('//input[@id="email"]');
  }

  notificationSearchBtn() {
    return cy.xpath('//button[@title="Search"]');
  }

  notificationRecord(notificationType, addressAs, email) {
    return cy.xpath(
      `//*[@class="group-name" and contains(text(), "${notificationType}")]/following-sibling::div//tbody//td[@data-testid="addressAs" and contains(text(), "${addressAs}")]/following-sibling::td//div[contains(text(), "${email}")]//ancestor::tr`
    );
  }

  deleteIconForNotificationRecord(notificationType, addressAs, email) {
    return cy.xpath(
      `//*[@class="group-name" and contains(text(), "${notificationType}")]/following-sibling::div//tbody//td[@data-testid="addressAs" and contains(text(), "${addressAs}")]/following-sibling::td//div[contains(text(), "${email}")]//ancestor::tr//*[@data-testid="icon-trash"]`
    );
  }

  deleteConfirmationModal() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]');
  }

  deleteConfirmationModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]//*[@class="modal-title"]');
  }

  deleteConfirmationModalContent() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]//*[@class="goa-scrollable"]');
  }

  deleteConfirmationModalConfirmBtn() {
    return cy.get('[data-testid="delete-confirm"]');
  }

  internalNotificationTypeEventResetBtn(cardTitle, eventName) {
    return cy.xpath(
      `//*[@data-testid="card-title"]//h2[contains(text(), "${cardTitle}")]//ancestor::*[@class="card-content"]/*[@data-testid="card-footer"]//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="delete-event"]`
    );
  }

  subscribersAddressAsSearchField() {
    return cy.xpath('//input[@id="name"]');
  }

  subscribersEmailSearchField() {
    return cy.xpath('//input[@id="email"]');
  }

  subscribersSearchBtn() {
    return cy.xpath('//button[@title="Search"]');
  }

  subscribersResetBtn() {
    return cy.xpath('//button[@title="Reset"]');
  }

  subscriberTableHeader() {
    return cy.xpath('//*[@data-testid="subscribers-list-title"]//table/div/thead');
  }

  subscriberTableBody() {
    return cy.xpath('//*[@data-testid="subscribers-list-title"]//table/div/tbody');
  }

  subscriberIconEye(addressAs, email) {
    return cy.xpath(
      `//*[@data-testid="subscribers-list-title"]//tbody//td[contains(text(), "${addressAs}")]/following-sibling::*[contains(text(), "${email}")]/parent::*//*[@data-testid="icon-eye"]`
    );
  }

  subscriberDeleteIcon(addressAs, email) {
    return cy.xpath(
      `//*[@data-testid="subscribers-list-title"]//tbody//td[contains(text(), "${addressAs}")]/following-sibling::*[contains(text(), "${email}")]/parent::*//*[@data-testid="icon-trash"]`
    );
  }

  subscriberSubscriptions(addressAs, email) {
    return cy.xpath(
      `//*[@data-testid="subscribers-list-title"]//tbody//td[contains(text(), "${addressAs}")]/following-sibling::*[contains(text(), "${email}")]/parent::*//following-sibling::tr[1]`
    );
  }

  subscriber(addressAs, email) {
    return cy.xpath(
      `//*[@data-testid="subscribers-list-title"]//table/div/tbody//td[contains(text(), "${addressAs}")]/following-sibling::*[contains(text(), "${email}")]/parent::*`
    );
  }

  subscriberDeleteConfirmationModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation"]//*[@class="modal-title"]');
  }

  subscriberDeleteConfirmationModalDeleteBtn() {
    return cy.xpath('//*[@data-testid="delete-confirmation"]//*[@data-testid="delete-confirm"]');
  }

  contactInformationEdit() {
    return cy.get('[data-testid="icon-create"]');
  }

  editContactModal() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]');
  }

  editContactModalEmail() {
    return cy.get('[data-testid="form-email"]');
  }

  editContactModalPhone() {
    return cy.get('[data-testid="contact-sms-input"]');
  }

  editContactModalInstructions() {
    return cy.get('[data-testid="form-support-instructions"]');
  }

  editContactModalSaveBtn() {
    return cy.get('[data-testid="form-save"]');
  }

  contactInformationEmail() {
    return cy.get('[data-testid="email"]');
  }

  contactInformationPhone() {
    return cy.get('[data-testid="phone"]');
  }

  contactInformationInstructions() {
    return cy.get('[data-testid="support-instructions"]');
  }

  subscriberEditIcon(addressAs, email) {
    return cy.xpath(
      `//*[@data-testid="subscribers-list-title"]//tbody//td[contains(text(), "${addressAs}")]/following-sibling::*[contains(text(), "${email}")]/parent::*//*[@data-testid="icon-create"]`
    );
  }

  editSubscriberModal() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]');
  }
}
export default NotificationsPage;
