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

  adminMenuItem(menuItemKey: string) {
    const menuItemSelector = `nav > div > [href="${menuItemKey}"] > span`;
    return cy.get(menuItemSelector);
  }

  readTheApiDocsLink() {
    return cy.xpath(
      '//*[contains(text(), "Helpful links")]/following-sibling::a[contains(text(), "Read the API docs")]'
    );
  }

  APIDocsPageTitle(text) {
    return cy.xpath(`//*[@class="title" and contains(text(), "${text}")]`);
  }

  serviceTab(service, text) {
    return cy.xpath(
      `//h1[contains(text(),"${service}")]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
    );
  }

  notificationMessage() {
    return cy.xpath('//*[@role="notification"]//*[@class="message"]');
  }

  deleteConfirmationModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation"]//*[@class="modal-title"]');
  }

  deleteConfirmationModalContent() {
    return cy.xpath('//*[@data-testid="delete-confirmation"]//*[@class="goa-scrollable"]');
  }

  deleteConfirmationModalDeleteBtn() {
    return cy.get('[data-testid="delete-confirm"]');
  }
}

export default Common;
