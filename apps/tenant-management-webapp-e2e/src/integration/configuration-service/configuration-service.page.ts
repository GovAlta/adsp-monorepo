class ConfigurationServicePage {
  configurationOverviewContent() {
    return cy.xpath('//h1[text()="Configuration service"]/parent::main//p');
  }

  definitionTitle(text) {
    return cy.xpath(`//*[text()="${text}"]`);
  }

  coreDefinitionsTable() {
    return cy.xpath(
      '//*[@data-testid="configuration-table"]//tbody/tr/td/parent::*/following-sibling::tr//*[contains(@data-testid, "configuration-name")]'
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

  configurationSchemaDetails() {
    return cy.get('[data-testid="configuration-details"]');
  }
}
export default ConfigurationServicePage;
