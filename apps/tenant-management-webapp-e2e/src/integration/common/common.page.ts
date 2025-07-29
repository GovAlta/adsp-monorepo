class Common {
  loginButton() {
    return cy.get('#kc-login');
  }

  usernameEmailField() {
    return cy.get('[name=username]');
  }

  passwordField() {
    return cy.get('[name=password]');
  }

  adminMenuItem(testid) {
    return cy.xpath(`//nav//*[@data-testid="${testid}"]`);
  }

  readTheApiDocsLink() {
    return cy.xpath(
      '//*[contains(text(), "Helpful links")]/following-sibling::*//a[contains(text(), "Read the API docs")]'
    );
  }

  APIDocsPageTitle(text) {
    return cy.xpath(`//*[@class="title" and contains(text(), "${text}")]`);
  }

  serviceTab(service, text) {
    return cy.xpath(`//h1[contains(text(),"${service}")]/ancestor::main//div[text()="${text}"]`);
  }

  notificationMessage() {
    return cy.get('goa-notification');
  }

  deleteConfirmationModalTitle() {
    return cy.xpath('//*[@testid="delete-confirmation" and @open="true"]//*[@slot="heading"]');
  }

  deleteConfirmationModalContent() {
    return cy.xpath('//*[@testid="delete-confirmation" and @open="true"]');
  }

  deleteConfirmationModalDeleteBtn() {
    return cy.xpath('//*[@testid="delete-confirmation" and @open="true"]//goa-button[@testid="delete-confirm"]');
  }

  deleteConfirmationModalCancelBtn() {
    return cy.xpath('//*[@testid="delete-confirmation" and @open="true"]//goa-button[@testid="delete-cancel"]');
  }

  seeTheCodeLink() {
    return cy.xpath('//*[contains(text(), "Helpful links")]/following-sibling::*//a[contains(text(), "See the code")]');
  }

  seeTheCodeIcon() {
    return cy.xpath('//*[contains(text(), "Helpful links")]/following-sibling::*//*[@testid="open-icon"]');
  }

  supportLink(link) {
    return cy.xpath(`//h3[text()="Support"]/following-sibling::*/*[contains(text(), "${link}")]`);
  }

  getSupportIcon() {
    return cy.xpath('//h3[text()="Support"]/following-sibling::*//goa-icon-button[@testid="mail-icon"]');
  }

  serviceOverviewContent(serviceOverviewTitle) {
    return cy.xpath(`//h1[text()="${serviceOverviewTitle}"]/ancestor::main//p`);
  }

  activeTab() {
    return cy.xpath('//div[contains(@data-testid, "tab-btn") and contains(@class, "active")]');
  }

  dontSaveButtonUnsavedChangesModal() {
    return cy.xpath('//goa-button[@testid="form-dont-save"]');
  }

  saveButtonUnsavedChangesModal() {
    return cy.xpath('//goa-button[@testid="form-agree-save"]');
  }

  cancelButtonUnsavedChangesModal() {
    return cy.xpath('//goa-button[@testid="form-cancel-modal"]');
  }

  loadMoreButton() {
    return cy.xpath('//goa-button[text()="Load more"]');
  }

  //Form app page objects:
  formAppLoginButton() {
    return cy.get('#kc-login');
  }

  formAppUsernameEmailField() {
    return cy.get('[name=username]');
  }

  formAppPasswordField() {
    return cy.get('[name=password]');
  }

  formAppFormTextField(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-input[@type="text"]`);
  }

  formAppFormSubmitButton() {
    return cy.xpath('//goa-button[text()="Submit" and @disabled="false"]');
  }

  //Status app page objects
  statusNotificationPleaseContact() {
    return cy.xpath('//*[@class="section-vs"]/a');
  }

  statusNotificationPageTitle() {
    return cy.get('h2[data-testid="service-name"]');
  }

  statusNotificationSignupDescription() {
    return cy.xpath('//h3[text()="Sign up for notifications"]/following-sibling::div/a');
  }

  applicationStatus(appName) {
    return cy.xpath(
      `//b[contains(text(),"${appName}")]/parent::div/following-sibling::div/div[@class="status-button"]/div`
    );
  }

  applicationStatusUpdatedTimestamp(appName) {
    return cy.xpath(
      `//b[contains(text(),"${appName}")]/ancestor::div[@class="flex-column"]//*[@data-testid="service-created-date"]`
    );
  }

  applicationNames() {
    return cy.xpath('//div[@class="title-line"]/following-sibling::div/div//b');
  }

  applicationBody() {
    return cy.xpath('//html/body');
  }
}
export default Common;
