class StatusServicePage {
  statusTabs() {
    return cy.xpath('//h1[contains(text(), "Service status")]/following-sibling::div[1]//descendant::div');
  }

  statusTab(text: string) {
    return cy.xpath(
      `//h1[contains(text(), "Service status")]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
    );
  }

  guidelinesTitle() {
    return cy.xpath('//*[contains(text(), "Guidelines for")]');
  }

  addNoticeButton() {
    return cy.get('[data-testid="add-notice"]');
  }

  noticeModalTitle() {
    return cy.xpath('//div[@data-testid="notice-modal" and @data-state="visible"]//div[@class="modal-title"]');
  }

  noticeModalDescField() {
    return cy.get('[data-testid="notice-form-description"]');
  }

  noticeModalAllApplicationsCheckbox() {
    return cy.xpath('//label[@class="goa-checkbox"]/div[contains(@class, "goa-checkbox-container")]');
  }

  noticeModalApplicationDropdown() {
    return cy.get('[id="multiselectContainerReact"]');
  }

  noticeModalApplicationDropdownItem(itemText) {
    return cy.xpath(`//div[@class="optionListContainer displayBlock"]//li[text() = "${itemText}"]`);
  }

  noticeModalStartTimeHourField() {
    return cy.xpath(
      '//div[@class="react-time-picker__inputGroup"]/input[@name="startTime"]/following-sibling::input[@max="12"]'
    );
  }

  noticeModalStartTimeMinuteField() {
    return cy.xpath(
      '//div[@class="react-time-picker__inputGroup"]/input[@name="startTime"]/following-sibling::input[@max="59"]'
    );
  }

  noticeModalStartTimeAmPmDropdown() {
    return cy.xpath(
      '//div[@class="react-time-picker__inputGroup"]/input[@name="startTime"]/following-sibling::select[@name="amPm"]'
    );
  }

  noticeModalEndTimeHourField() {
    return cy.xpath(
      '//div[@class="react-time-picker__inputGroup"]/input[@name="endTime"]/following-sibling::input[@max="12"]'
    );
  }

  noticeModalEndTimeMinuteField() {
    return cy.xpath(
      '//div[@class="react-time-picker__inputGroup"]/input[@name="endTime"]/following-sibling::input[@max="59"]'
    );
  }

  noticeModalEndTimeAmPmDropdown() {
    return cy.xpath(
      '//div[@class="react-time-picker__inputGroup"]/input[@name="endTime"]/following-sibling::select[@name="amPm"]'
    );
  }

  noticeModalSaveButton() {
    return cy.get('[data-testid=notice-form-submit]');
  }

  noticeList() {
    return cy.xpath('//*[@data-testid="notice-list"]/div/div');
  }

  noticeCardMode(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-mode"]/div`);
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

  filterByStatusRadio(type) {
    return cy.xpath(`//*[@class="goa-radio"]/input[@value="${type}"]/ancestor::div[@class="filter-radio"]`);
  }

  applicationHealthChangeNotificationSubscribeCheckbox() {
    return cy.xpath('//*[@class="goa-checkbox"]//*[@name="subscribe"]/parent::div');
  }

  addApplicationButton() {
    return cy.get('[data-testid="add-application"]');
  }

  addApplicationModalTitle() {
    return cy.xpath(
      '//div[@class="modal-root" and @data-state="visible"]/div[@class="modal"]/div[@class="modal-container"]/div[@class="modal-title"]'
    );
  }

  addApplicationNameModalField() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//input[@aria-label="name"]');
  }

  addApplicationDescriptionModalField() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//textarea[@aria-label="description"]');
  }

  addApplicationEndpointModalField() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//input[@aria-label="endpoint"]');
  }

  addApplicationSaveBtn() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//button[2]');
  }

  applicationList() {
    return cy.get('[data-testid="application"]');
  }

  applicationListEditBtn() {
    return cy.xpath(`(//*[@data-testid="application"]//*[name()='svg'])[3]`);
  }

  applicationListDeleteBtn() {
    return cy.xpath(`(//*[@data-testid="application"]//div[@data-testid='icon-trash'])[1]`);
  }

  applicationDeleteConfirmationModalTitle() {
    return cy.xpath('//div[@class="modal-container"]/div[@class="modal-title"]');
  }

  applicationDeleteConfirmationModalContent() {
    return cy.xpath('//div[@class="modal-container"]/div[@class="goa-scrollable"]');
  }

  applicationDeleteConfirmationModalYesBtn() {
    return cy.xpath(`//div[contains(@data-state,'visible')]//button[contains(@class,'')][normalize-space()='Yes']`);
  }
}
export default StatusServicePage;
