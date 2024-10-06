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
    return cy.xpath('//*[@data-testid="delete-confirmation" and @open="true"]//*[@slot="heading"]');
  }

  deleteConfirmationModalContent() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @open="true"]');
  }

  deleteConfirmationModalDeleteBtn() {
    return cy.xpath(
      '//*[@data-testid="delete-confirmation" and @open="true"]//goa-button[@data-testid="delete-confirm"]'
    );
  }

  deleteConfirmationModalCancelBtn() {
    return cy.xpath(
      '//*[@data-testid="delete-confirmation" and @open="true"]//goa-button[@data-testid="delete-cancel"]'
    );
  }

  seeTheCodeLink() {
    return cy.xpath('//*[contains(text(), "Helpful links")]/following-sibling::*//a[contains(text(), "See the code")]');
  }

  seeTheCodeIcon() {
    return cy.xpath('//*[contains(text(), "Helpful links")]/following-sibling::*//*[@data-testid="open-icon"]');
  }

  supportLink(link) {
    return cy.xpath(`//h3[text()="Support"]/following-sibling::*/*[contains(text(), "${link}")]`);
  }

  getSupportIcon() {
    return cy.xpath('//h3[text()="Support"]/following-sibling::*//goa-icon-button[@data-testid="mail-icon"]');
  }

  serviceOverviewContent(serviceOverviewTitle) {
    return cy.xpath(`//h1[text()="${serviceOverviewTitle}"]/ancestor::main//p`);
  }

  activeTab() {
    return cy.xpath('//div[contains(@data-testid, "tab-btn") and contains(@class, "active")]');
  }

  dontSaveButtonUnsavedChangesModal() {
    return cy.xpath('//goa-button[@data-testid="form-dont-save"]');
  }

  saveButtonUnsavedChangesModal() {
    return cy.xpath('//goa-button[@data-testid="form-agree-save"]');
  }

  cancelButtonUnsavedChangesModal() {
    return cy.xpath('//goa-button[@data-testid="form-cancel-modal"]');
  }

  loadMoreButton() {
    return cy.xpath('//goa-button[text()="Load more"]');
  }
}
export default Common;
