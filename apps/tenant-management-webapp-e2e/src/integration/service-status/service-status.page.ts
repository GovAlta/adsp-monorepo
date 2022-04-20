class StatusServicePage {
  statusTabs() {
    return cy.xpath('//h1[contains(text(), "Status")]/following-sibling::div[1]//descendant::div');
  }

  statusTab(text: string) {
    return cy.xpath(
      `//h1[contains(text(), "Status")]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
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
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//*[label="URL"]//input');
  }

  addApplicationSaveBtn() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//button[text()="Save"]');
  }

  applicationCardTitle(appName) {
    return cy.xpath(`//*[@data-testid="application"]//div[contains(text(), "${appName}")]`);
  }

  applicationCardEditBtn(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//div[@data-testid="icon-create"]`
    );
  }

  applicationCardDeleteBtn(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//div[@data-testid="icon-trash"]`
    );
  }

  applicationCardChangeStatusBtn(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//button[text()='Change status']`
    );
  }

  manualStatusChangeModalTitle() {
    return cy.xpath('//*[@class="modal-root" and @data-state="visible"]//*[@class="modal-title"]');
  }

  manualStatusChangeModalStatusRadio(statusName) {
    return cy.xpath(
      `//*[@class="modal-root" and @data-state="visible"]//input[@value="${statusName}"]/following-sibling::div`
    );
  }

  manualStatusChangeModalSaveBtn() {
    return cy.xpath('//*[@class="modal-root" and @data-state="visible"]//button[text()="Save"]');
  }

  applicationCardStatusBadge(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//*[contains(@class, "badge-content")]`
    );
  }

  manualStatusList() {
    return cy.xpath(
      '//*[@class="modal-root" and @data-state="visible"]//*[@class="goa-form-item"]//div/*[@class="goa-radio"]'
    );
  }

  manualStatusListCheckedInput() {
    return cy.xpath(
      '//*[@class="modal-root" and @data-state="visible"]//*[@class="goa-form-item"]//div/*[@class="goa-radio"]//input[@type="radio" and @checked]'
    );
  }

  manualStatusListInput() {
    return cy.xpath(
      '//*[@class="modal-root" and @data-state="visible"]//*[@class="goa-form-item"]//div/*[@class="goa-radio"]//input[@type="radio"]'
    );
  }
}
export default StatusServicePage;
