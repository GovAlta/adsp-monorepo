class ConfigurationServicePage {
  configurationOverviewContent() {
    return cy.xpath('//h1[text()="Configuration service"]/parent::main//p');
  }

  definitionTitle(text) {
    return cy.xpath(`//*[text()="${text}"]`);
  }

  coreDefinitionsTable() {
    return cy.xpath('//table[@data-testid="configuration-name"]//tbody');
  }

  definitionsToggleButton(definitionName) {
    return cy.xpath(
      `//*[@data-testid="configuration-name"]//tbody/tr/td[text()="${definitionName}"]/following-sibling::td//button[@data-testid="configuration-toggle-details-visibility"]`
    );
  }

  definitionsDetails() {
    return cy.get('[data-testid="configuration-details"]');
  }
}
export default ConfigurationServicePage;
