class eventsPage {
  eventsOverviewh3Title() {
    return cy.xpath('//h2[contains(text(), Events)]/following-sibling::div[2]//h3');
  }

  event(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name"][contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"][contains(text(), "${eventName}")]`
    );
  }

  eventWithDesc(namespace, eventName, eventDesc) {
    return cy.xpath(
      `//div[@class="group-name"][contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"][contains(text(), "${eventName}")]/following-sibling::td[contains(text(), "${eventDesc}")]`
    );
  }

  showDetailsIcon(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name"][contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"][contains(text(), "${eventName}")]/following-sibling::td//*[@data-testid="toggle-details-visibility"]/*[@data-testid="icon-eye"]`
    );
  }

  hideDetailsIcon(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name"][contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"][contains(text(), "${eventName}")]/following-sibling::td//*[@data-testid="toggle-details-visibility"]/*[@data-testid="icon-eyeOff"]`
    );
  }

  eventDetails(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name"][contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"][contains(text(), "${eventName}")]/parent::tr/following-sibling::tr//*[@data-testid="details"]`
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

  definitionModalPayloadSchema() {
    return cy.xpath(
      '//*[@data-testid="definition-form" and @data-state="visible"]//*[@class="monaco-scrollable-element editor-scrollable vs"]'
    );
  }

  definitionModalSaveButton() {
    return cy.xpath('//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="form-save"]');
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

  deleteDefinitionModalTitle() {
    return cy.xpath('//*[@data-testid="delete-confirmation" and @data-state="visible"]//div[@class="modal-title"]');
  }

  deleteDefinitionModalContent() {
    return cy.xpath(
      '//*[@data-testid="delete-confirmation" and @data-state="visible"]//div[@class="goa-scrollable"]/div'
    );
  }

  deleteDefinitionConfirmButton() {
    return cy.xpath(
      '//*[@data-testid="delete-confirmation" and @data-state="visible"]//button[@data-testid="delete-confirm"]'
    );
  }
}

export default eventsPage;
