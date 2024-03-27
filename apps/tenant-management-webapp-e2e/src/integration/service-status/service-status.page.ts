class StatusServicePage {
  statusTabs() {
    return cy.xpath('//h1[contains(text(), "Status")]/following-sibling::div[1]//descendant::div');
  }

  statusTitle() {
    return cy.get('[data-testid="status-title"]');
  }

  guidelinesTitle() {
    return cy.xpath('//*[contains(text(), "Guidelines for")]');
  }

  addNoticeButton() {
    return cy.get('[data-testid="add-notice"]');
  }

  noticeModalTitle() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//*[@slot="heading"]');
  }

  noticeModalDescField() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//*[@data-testid="notice-form-description"]');
  }

  noticeModalAllApplicationsCheckbox() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//goa-checkbox[@name="isAllApplications"]');
  }

  noticeModalApplicationDropdown() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//*[@data-testid="application-dropdown-list"]');
  }

  noticeModalApplicationDropdownItem(itemText) {
    return cy.xpath(
      `//*[@data-testid="notice-modal" and @open="true"]//*[@data-testid="dropdown-menu"]//li[text() = "${itemText}"]`
    );
  }

  noticeModalApplicationDropdownItems() {
    return cy.xpath(
      '//goa-modal[@open="true"]//goa-dropdown[@data-testid="application-dropdown-list"]//goa-dropdown-item'
    );
  }

  noticeModalStartTimeField() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//goa-form-item[@label="Start time"]//goa-input');
  }

  noticeModalEndTimeField() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//goa-form-item[@label="End time"]//goa-input');
  }

  noticeModalSaveButton() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//goa-button[@type="primary"]');
  }

  noticeModalCancelButton() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//*[@data-testid=notice-form-cancel]');
  }

  noticeList() {
    return cy.xpath('//*[@data-testid="notice-list"]/div/div');
  }

  noticeCardMode(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-mode"]`);
  }

  noticeCardDesc(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-message"]`);
  }

  noticeCardApp(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-application"]`);
  }

  noticeCardStartDateTime(index) {
    return cy.xpath(
      `//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-start-date"]/*[@class="time"]`
    );
  }

  noticeCardEndDateTime(index) {
    return cy.xpath(
      `//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-end-date"]/*[@class="time"]`
    );
  }

  noticeCardGearButton(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-gear-button"]`);
  }

  noticeCardGearButtons() {
    return cy.get('[data-testid="notice-card-gear-button"]');
  }

  noticeCardEditMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-edit"]`);
  }

  noticeCardDeleteMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-delete"]`);
  }

  noticeCardPublishMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-publish"]`);
  }

  noticeCardUnpublishMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-unpublish"]`);
  }

  noticeCardArchiveMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-archive"]`);
  }

  filterByStatusRadioGroup() {
    return cy.xpath('//goa-radio-group[@name="option"]');
  }

  applicationHealthChangeNotificationSubscribeCheckbox() {
    return cy.xpath('//goa-checkbox[@name="subscribe"]');
  }

  addApplicationButton() {
    return cy.get('[data-testid="add-application"]');
  }

  addEditApplicationModalTitle() {
    return cy.xpath('//goa-modal[@open="true"]//*[@slot="heading"]');
  }

  addEditApplicationNameModalField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-input[@name="name"]');
  }

  addEditApplicationDescriptionModalField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-textarea[@name="description"]');
  }

  addEditApplicationEndpointModalField() {
    return cy.xpath('//goa-modal[@open="true"]//*[@label="URL"]//goa-input');
  }

  addEditApplicationSaveBtn() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[text()="Save"]');
  }

  addEditApplicationCancelBtn() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[text()="Cancel"]');
  }

  applicationCardTitle(appName) {
    return cy.xpath(`//*[@data-testid="application"]//div[contains(text(), "${appName}")]`);
  }

  applicationCardEditBtn(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//*[@data-testid="status-edit-button"]`
    );
  }

  applicationCardDeleteBtn(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//*[@title="Delete"]`
    );
  }

  applicationCardChangeStatusBtn(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//goa-button[text()='Change status']`
    );
  }

  applicationCardMonitorOnlyCheckbox(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]//ancestor::*[@data-testid="application"]//*[@data-testid="monitor-only-checkbox"]`
    );
  }

  manualStatusChangeModalTitle() {
    return cy.xpath('//goa-modal[@open="true"]//*[@slot="heading"]');
  }

  manualStatusChangeModalStatusRadioGroup() {
    return cy.xpath('//goa-modal[@open="true"]//goa-radio-group[@data-testid="status-radio-group"]');
  }

  manualStatusChangeModalSaveBtn() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[text()="Save"]');
  }

  applicationCardStatusBadge(appName) {
    return cy.xpath(`//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//goa-badge`);
  }

  manualStatusChangeModalItemList() {
    return cy.xpath(
      '//*[@class="modal-root" and @data-state="visible"]//*[@class="goa-form-item"]//div/*[@class="goa-radio"]'
    );
  }

  contactInformationEditBtn() {
    return cy.xpath('//*[@data-testid="edit-contact-info"]//goa-icon-button');
  }

  editContactInformationModal() {
    return cy.xpath('//*[@data-testid="edit-contact-information-status"]//*[@slot="heading"]');
  }

  editContactInformationEmail() {
    // return cy.get('[data-testid="form-email"]');
    return cy.xpath('//goa-input[@data-testid="form-email"]');
  }

  editContactInformationEmailSaveBtn() {
    return cy.get('[data-testid="form-save"]');
  }

  editContactInformationEmailCancelBtn() {
    return cy.get('[data-testid="form-cancel"]');
  }

  contactInformationEmailDisplay() {
    return cy.get('[data-testid="email"]');
  }
}
export default StatusServicePage;
