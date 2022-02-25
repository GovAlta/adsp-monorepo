class eventsPage {
  eventsOverviewh3Title() {
    return cy.xpath('//h1[contains(text(), Events)]/following-sibling::div[2]//h2');
  }

  event(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]`
    );
  }

  eventWithDesc(namespace, eventName, eventDesc) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td[contains(text(), "${eventDesc}")]`
    );
  }

  eventNames(namespace) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"]`
    );
  }

  eventDescs(namespace) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="description"]`
    );
  }

  showDetailsIcon(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td//*[@data-testid="toggle-details-visibility"]/*[@data-testid="icon-eye"]`
    );
  }

  hideDetailsIcon(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td//*[@data-testid="toggle-details-visibility"]/*[@data-testid="icon-eye-off"]`
    );
  }

  eventDetails(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/parent::tr/following-sibling::tr//*[@data-testid="details"]`
    );
  }

  addDefinitionButton() {
    return cy.get('[data-testid="add-definition"]');
  }

  definitionModal() {
    return cy.xpath('//*[@data-testid="definition-form"]');
  }

  definitionModalTitle() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//div[@class="modal-title"]');
  }

  definitionModalNamespaceField() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-namespace"]');
  }

  definitionModalNamespaceFieldErrorMsg() {
    return cy.xpath('//input[@data-testid="form-namespace"]/following-sibling::div[@class="error-msg"]');
  }

  definitionModalNameField() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-name"]');
  }

  definitionModalNameFieldErrorMsg() {
    return cy.xpath('//input[@data-testid="form-name"]/following-sibling::div[@class="error-msg"]');
  }

  definitionModalDescriptionField() {
    return cy.xpath(
      '//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-description"]'
    );
  }

  definitionModalPayloadSchema() {
    return cy.xpath(
      '//*[@data-testid="definition-form" and @data-state="visible"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  definitionModalSaveButton() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-save"]');
  }

  definitionModalCancelButton() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-cancel"]');
  }

  editDefinitionButton(namespace, eventName, eventDesc) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td[@data-testid="description" and contains(text(), "${eventDesc}")]/following-sibling::td//*[@data-testid="edit-details"]`
    );
  }

  editDefinitionButtonWithNamespaceAndName(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td[@data-testid="description"]/following-sibling::td//*[@data-testid="edit-details"]`
    );
  }

  deleteDefinitionButton(namespace, eventName, eventDesc) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td[@data-testid="description" and contains(text(), "${eventDesc}")]/following-sibling::td//*[@data-testid="delete-details"]`
    );
  }

  deleteDefinitionButtonWithNamespaceAndName(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name" and contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name" and contains(text(), "${eventName}")]/following-sibling::td[@data-testid="description"]/following-sibling::td//*[@data-testid="delete-details"]`
    );
  }
}

export default eventsPage;
