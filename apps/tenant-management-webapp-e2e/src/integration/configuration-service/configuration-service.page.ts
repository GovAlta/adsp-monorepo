class ConfigurationServicePage {
  namespaceTitle(text) {
    return cy.xpath(`//*[text()="${text}"]`);
  }

  configurationDefinitionWithName(name) {
    return cy.xpath(
      `//*[@data-testid="configuration-table"]//tbody/tr/td/parent::*/following-sibling::tr//*[@data-testid="configuration-name" and contains(text(), "${name}")]`
    );
  }

  configurationDefinition(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/parent::tr`
    );
  }

  configurationDefinitionEditBtn(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/following-sibling::td//button[@data-testid="edit-details"]`
    );
  }

  configurationDefinitionDeleteBtn(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/following-sibling::td//button[@data-testid="delete-config"]`
    );
  }

  configurationDefinitionEyeBtn(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/following-sibling::td//button[@data-testid="configuration-toggle-details-visibility"]`
    );
  }

  configurationDetailsIcon(name) {
    return cy.xpath(
      `//*[@data-testid="configuration-name" and contains(text(), "${name}")]/following-sibling::td//*[@data-testid="configuration-toggle-details-visibility"]`
    );
  }

  configurationHideDetailsIcon(name) {
    return cy.xpath(
      `//*[@data-testid="configuration-name" and contains(text(), "${name}")]/following-sibling::td//*[@data-testid="icon-eye-off"]`
    );
  }

  configurationSchemaDetails(name) {
    return cy.xpath(
      `//*[@data-testid="configuration-name" and contains(text(), "${name}")]/parent::tr/following-sibling::tr//*[@data-testid="configuration-details"]`
    );
  }

  configurationDefinitionDetails(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/parent::tr/following-sibling::tr//*[@data-testid="configuration-details"]`
    );
  }

  addConfigurationDefinitionBtn() {
    return cy.get('[data-testid="add-definition"]');
  }

  configurationDefinitionModalTitle() {
    return cy.xpath(
      '//*[@data-testid="definition-form" and @data-state="visible"]//*[@data-testid="definition-form-title"]'
    );
  }

  addConfigurationDefinitionModalNamespaceField() {
    return cy.get('[data-testid="form-namespace"]');
  }

  addConfigurationDefinitionModalNameField() {
    return cy.get('[data-testid="form-name"]');
  }

  addConfigurationDefinitionModalDescField() {
    return cy.get('[data-testid="form-description"]');
  }

  addConfigurationDefinitionModalNamespaceErrorMsg() {
    return cy.xpath(
      '//*[@data-testid="definition-form"]//label[text()="Namespace"]/following-sibling::div[@class="error-msg"]'
    );
  }

  addConfigurationDefinitionModalNameErrorMsg() {
    return cy.xpath(
      '//*[@data-testid="definition-form"]//label[text()="Name"]/following-sibling::div[@class="error-msg"]'
    );
  }

  configurationDefinitionModalSaveBtn() {
    return cy.xpath('//*[@data-testid="definition-form"]//button[@data-testid="form-save"]');
  }

  configurationDefinitionModalPayloadEditor() {
    return cy.xpath('//div[@class="monaco-scrollable-element editor-scrollable vs"]/following-sibling::textarea');
  }

  exportServiceInfoIcon(namespace, name) {
    return cy.xpath(
      `//h3[text()="${namespace}"]/following-sibling::div//div[text()="${name}"]/parent::*/following-sibling::div[@class="info-circle"]`
    );
  }

  exportServiceInfoBubble(namespace, name) {
    return cy.xpath(
      `//h3[text()="${namespace}"]/following-sibling::div//div[text()="${name}"]/parent::div/parent::div/following-sibling::div//div[@class="overflow-wrap bubble-border"]`
    );
  }
}
export default ConfigurationServicePage;
