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

  addDefinitionButton() {
    return cy.get('[data-testid="add-definition"]');
  }

  definitionModalTitle() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//div[@class="modal-title"]');
  }

  definitionModalNamespaceField() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-namespace"]');
  }

  definitionModalNameField() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-name"]');
  }

  definitionModalDescriptionField() {
    return cy.xpath(
      '//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-description"]'
    );
  }

  definitionModalSaveButton() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-save"]');
  }

  eventWithDesc(namespace, eventName, eventDesc) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td[contains(text(), "${eventDesc}")]`
    );
  }

  editDefinitionButton(namespace, eventName, eventDesc) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td[@data-testid="description" and contains(text(), "${eventDesc}")]/following-sibling::td//*[@data-testid="edit-details"]`
    );
  }

  deleteDefinitionButton(namespace, eventName, eventDesc) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td[@data-testid="description" and contains(text(), "${eventDesc}")]/following-sibling::td//*[@data-testid="delete-details"]`
    );
  }

  deleteDefinitionConfirmButton() {
    return cy.xpath(
      '//*[@data-testid="delete-confirmation" and @data-state="visible"]//button[@data-testid="delete-confirm"]'
    );
  }

  deleteDefinitionModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]//div[@class="modal-title"]');
  }

  deleteDefinitionModalContent() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]//div[@class="goa-scrollable"]');
  }
}

export default Common;
