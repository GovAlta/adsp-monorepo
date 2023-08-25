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

  notificationTypeModalPublicCheckbox() {
    return cy.xpath('//goa-checkbox[@name="anonymousRead-checkbox"]');
  }

  notificationTypeModalRolesCheckboxes() {
    return cy.xpath(
      '//*[@data-testid="notification-types-form"]//tbody/tr/td[@class="role-name"]/following-sibling::td//goa-checkbox'
    );
  }

  notificationTypeModalRolesCheckbox(roleLabel) {
    return cy.xpath(
      `//*[@data-testid="notification-types-form"]//tbody/tr/td[@class="role-name" and text()="${roleLabel}"]/following-sibling::td//goa-checkbox`
    );
  }

  notificationTypeModalClientRoleCheckbox(clientRole) {
    const role = `Notifications-type-subscribe-role-checkbox-${clientRole}`;
    return cy.xpath(`//goa-checkbox[@name="${role}"]`);
  }

  notificationChannelCheckbox(channelName) {
    return cy.xpath(`//*[@class="modal"]//goa-checkbox[@name="${channelName}"]`);
  }

  notificationChannelEmailCheckbox() {
    return cy.xpath('//goa-checkbox[@name="email"]');
  }

  notificationTypeModalSelfServiceCheckbox() {
    return cy.xpath('//*[@data-testid="manage-subscriptions-checkbox-wrapper"]//goa-checkbox');
  }

  notificationTypeModalSelfServiceCalloutContent() {
    return cy.xpath('//goa-checkbox[@name="subscribe"]/following-sibling::*//goa-callout');
  }

  notificationTypeModalSaveBtn() {
    return cy.get('[data-testid="form-save"]');
  }

  notificationTypeModalCancelBtn() {
    return cy.get('[data-testid="form-cancel"]');
  }

  notificationTypeEditBtn(notificationTypeTitle) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${notificationTypeTitle}")]/following-sibling::*//*[@data-testid="edit-notification-type"]`
    );
  }

  notificationTypeDeleteBtn(notificationTypeTitle) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${notificationTypeTitle}")]/following-sibling::*//*[@data-testid="icon-trash"]`
    );
  }

  addANotificationTypeButtonOnNotificationTypesPage() {
    return cy.get('[data-testid="add-notification"]');
  }

  notificationTypeCardTitle(notificationTypeTitle) {
    return cy.xpath(`//goa-container//h2[contains(text(), "${notificationTypeTitle}")]`);
  }

  notificationTypeCardDesc(notificationTypeTitle) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${notificationTypeTitle}")]//ancestor::*/following-sibling::*[contains(text(), "Description:")]`
    );
  }

  notificationTypeSubscriberRoles(notificationTypeTitle) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*//*[@data-testid="tenant-subscriber-roles"]`
    );
  }

  notificationTypePublicSubscription(notificationTypeTitle) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*//*[@data-testid="tenant-public-subscription"]`
    );
  }

  notificationTypeSelfService(notificationTypeTitle) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*//*[@data-testid="tenant-self-service"]`
    );
  }

  notificationTypeCoreSelfService(notificationTypeTitle) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${notificationTypeTitle}")]/parent::*/following-sibling::*//*[@data-testid="core-self-service"]`
    );
  }

  notificationTypeSelectAnEventBtn(cardTitle) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]/ancestor::goa-container//goa-button[contains(text(), "Select an event")]`
    );
  }

  selectAnEventModalTitle() {
    return cy.xpath(
      '//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//*[@class="modal-title"]'
    );
  }

  selectAnEventModalEventDropdown() {
    return cy.xpath(
      '//*[@data-testid="event-form" and @data-state="visible"]/*[@class="modal"]//goa-dropdown[@name="event"]'
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
      `//goa-container//h2[contains(text(), "${notificationTypeTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//div[@class="flex1"]`
    );
  }

  notificationTypeCardFooterItems(notificationTypeTitle) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${notificationTypeTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div/div`
    );
  }

  eventDeleteIcon(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/following-sibling::*[@class="rowFlex"]//*[@data-testid="icon-trash"]`
    );
  }

  // Internal notification type card elements have different xpath than those from custom created notification type cards, so use "Internal" prefix for the following several UI page object names
  notificationTypeEventMailIcon(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="core-email-channel"]`
    );
  }

  notificationTypeEventEditButton(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="edit-event"]`
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
    return cy.xpath('//goa-input[@id="name"]');
  }

  searchSubscriberEmail() {
    return cy.xpath('//goa-input[@id="email"]');
  }

  searchSubscriberPhone() {
    return cy.xpath('//goa-input[@id="sms"]');
  }

  notificationSearchBtn() {
    return cy.xpath('//goa-button[text()="Search"]');
  }

  notificationRecord(notificationType, addressAs, email) {
    return cy.xpath(
      `//*[@class="group-name" and contains(text(), "${notificationType}")]/following-sibling::div//tbody//td[@data-testid="addressAs" and contains(text(), "${addressAs}")]/following-sibling::td//div[contains(text(), "${email}")]//ancestor::tr`
    );
  }

  notificationRecordEyeIcon(notificationType, addressAs, email) {
    return cy.xpath(
      `//*[@class="group-name" and contains(text(), "${notificationType}")]/following-sibling::div//tbody//td[@data-testid="addressAs" and contains(text(), "${addressAs}")]/following-sibling::td//div[contains(text(), "${email}")]//ancestor::tr/td[@data-testid="actions"]//*[@data-testid="toggle-details-visibility"]`
    );
  }

  notificationRecordDetailsCriteria(notificationType, addressAs, email) {
    return cy.xpath(
      `//*[@class="group-name" and contains(text(), "${notificationType}")]/following-sibling::div//tbody//td[@data-testid="addressAs" and contains(text(), "${addressAs}")]/following-sibling::td//div[contains(text(), "${email}")]//ancestor::tr/following-sibling::tr//div[@data-testid="subscriber-criteria"]`
    );
  }

  deleteIconForNotificationRecord(notificationType, addressAs, email) {
    return cy.xpath(
      `//*[@class="group-name" and contains(text(), "${notificationType}")]/following-sibling::div//tbody//td[@data-testid="addressAs" and contains(text(), "${addressAs}")]/following-sibling::td//div[contains(text(), "${email}")]//ancestor::tr//*[contains(@data-testid, "delete-subscription")]`
    );
  }

  deleteConfirmationModal() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @open="true"]');
  }

  deleteConfirmationModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @open="true"]//*[@slot="heading"]');
  }

  deleteConfirmationModalContent() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @open="true"]');
  }

  deleteConfirmationModalConfirmBtn() {
    return cy.get('[data-testid="delete-confirm"]');
  }

  notificationTypeEventDeleteBtn(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="delete-event"]`
    );
  }

  subscribersAddressAsSearchField() {
    return cy.xpath('//goa-input[@id="name"]');
  }

  subscribersEmailSearchField() {
    return cy.xpath('//goa-input[@id="email"]');
  }

  subscribersSearchBtn() {
    return cy.xpath('//goa-button[text()="Search"]');
  }

  subscribersResetBtn() {
    return cy.xpath('//goa-button[text()="Reset"]');
  }

  subscriberTableHeader() {
    return cy.xpath('//*[@data-testid="subscribers-list-title"]//table/div/thead');
  }

  subscriberTableBody() {
    return cy.xpath('//*[@data-testid="subscribers-list-title"]//table/div/tbody');
  }

  subscriberIconEye(addressAs, email) {
    return cy.xpath(
      `//*[@data-testid="subscribers-list-title"]//tbody//td[contains(text(), "${addressAs}")]/following-sibling::*[contains(text(), "${email}")]/parent::*//*[@data-testid="toggle-details-visibility"]`
    );
  }

  subscriberDeleteIcon(addressAs, email) {
    return cy.xpath(
      `//*[@data-testid="subscribers-list-title"]//tbody//td[contains(text(), "${addressAs}")]/following-sibling::*[contains(text(), "${email}")]/parent::*//*[@data-testid="delete-icon"]`
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

  subscriberWithPhoneNumber(addressAs, email, phoneNumber) {
    return cy.xpath(
      `//*[@data-testid="subscribers-list-title"]//table/div/tbody//td[contains(text(), "${addressAs}")]/following-sibling::*[contains(text(), "${email}")]/following-sibling::*[contains(text(), "${phoneNumber}")]/parent::*`
    );
  }

  subscriberDeleteConfirmationModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation"]/*[@slot="heading"]');
  }

  subscriberDeleteConfirmationModalDeleteBtn() {
    return cy.xpath('//*[@data-testid="delete-confirmation"]//*[@data-testid="delete-confirm"]');
  }

  contactInformationEdit() {
    return cy.get('[data-testid="contact-info-edit"]');
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

  editContactModalCancelBtn() {
    return cy.get('[data-testid="form-cancel"]');
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
      `//*[@data-testid="subscribers-list-title"]//tbody//td[contains(text(), "${addressAs}")]/following-sibling::*[contains(text(), "${email}")]/parent::*//*[contains(@data-testid, "edit-subscription-item")]`
    );
  }

  editSubscriberModal() {
    return cy.xpath('//div[@class="modal-title" and text()="Edit subscriber"]/ancestor::div[@class="modal"]');
  }

  editSubscriberModalSaveBtn() {
    return cy.get('[data-testid="form-save"]');
  }

  editSubscriberModalNameField() {
    return cy.get('[data-testid="form-name"]');
  }

  editSubscriberModalEmailField() {
    return cy.get('[data-testid="form-email"]');
  }

  editSubscriberModalPhoneNumberField() {
    return cy.get('[data-testid="contact-sms-input"]');
  }

  addNotificationTypeBtnOnNotificationType() {
    return cy.get('[data-testid="add-notification"]');
  }

  tenantNotificationTypeEventMailIcon(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="tenant-email-channel"]`
    );
  }

  tenantNotificationTypeEventMailBadge(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="tenant-email-badge"]`
    );
  }

  tenantNotificationTypeEventBotIcon(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="tenant-bot-channel"]`
    );
  }

  tenantNotificationTypeEventBotIconBadge(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="tenant-bot-channel-badge"]`
    );
  }

  tenantNotificationTypeEventSmsIcon(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="tenant-sms-channel"]`
    );
  }

  tenantNotificationTypeEventSmsIconBadge(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="tenant-sms-channel-badge"]`
    );
  }

  notificationEventTemplateTab(text) {
    return cy.xpath(
      `//*[@data-testid="template-form"]//*[@class="goa-form-item"]//descendant::div//descendant::div/div/div[contains(text(), "${text}")]`
    );
  }

  eventTemplateModal() {
    return cy.xpath('//*[@data-testid="template-form" and @open]');
  }

  eventTemplateModalSubject(channel) {
    return cy.xpath(
      `//*[@data-testid="modal-title" and contains(text(), "${channel}")]//parent::*//*[@data-testid="templated-editor-subject"]//div[@class="monaco-scrollable-element editor-scrollable vs"]/following-sibling::textarea`
    );
  }

  eventTemplateModalBody(channel) {
    return cy.xpath(
      `//*[@data-testid="modal-title" and contains(text(), "${channel}")]//parent::*//*[@data-testid="templated-editor-body"]//div[@class="monaco-scrollable-element editor-scrollable vs"]/following-sibling::textarea`
    );
  }

  editTemplateModalTitle() {
    return cy.get('[data-testid="modal-title"]');
  }

  editTemplateModalEmailSubject() {
    return cy.get('[data-testid="templated-editor-subject"]');
  }

  templateModalPreviewPaneEmailSubject() {
    return cy.get('[data-testid="email-preview-subject"]');
  }

  editTemplateModalEmailBody() {
    return cy.get('[data-testid="templated-editor-body"]');
  }

  templateModalPreviewPaneEmailBody() {
    return cy.get('[data-testid="email-preview-body"]');
  }

  editTemplateModalCloseBtn() {
    return cy.get('[data-testid="template-form-close"]');
  }

  editTemplateModalSaveallBtn() {
    return cy.get('[data-testid="template-form-save"]');
  }

  notificationTypeEventResetBtn(cardTitle, eventName) {
    return cy.xpath(
      `//goa-container//h2[contains(text(), "${cardTitle}")]//ancestor::goa-container//h2[text()="Events:"]/following-sibling::div//*[@class="flex1" and contains(., "${eventName}")]/parent::*/following-sibling::*//*[@data-testid="reset-button"]`
    );
  }

  resetEmailTemplateModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation"]/*[@slot="heading"]');
  }

  resetEmailTemplateModalDeleteBtn() {
    return cy.xpath('//*[@data-testid="delete-confirmation"]//*[@data-testid="delete-confirm"]');
  }

  templateModalPreviewPaneSMSSubject() {
    return cy.xpath('//*[@data-testid="sms-preview-body"]/div[1]');
  }

  templateModalPreviewPaneSMSBody() {
    return cy.xpath('//*[@data-testid="sms-preview-body"]/div[@class="marginBottom"]');
  }

  templateModalPreviewPaneBotSubject() {
    return cy.xpath('//*[@data-testid="bot-preview"]/div/b/p');
  }

  templateModalPreviewPaneBotBody() {
    return cy.xpath('//*[@data-testid="bot-preview"]/div/p');
  }

  templateModalHelpText() {
    return cy.get('#helpText');
  }
}
export default NotificationsPage;
