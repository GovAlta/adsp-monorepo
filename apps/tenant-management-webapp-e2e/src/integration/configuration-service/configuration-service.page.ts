class ConfigurationServicePage {
  configurationOverviewContent() {
    return cy.xpath('//h1[text()="Configuration service"]/parent::main//p');
  }

  namespaceTitle(text) {
    return cy.xpath(`//*[text()="${text}"]`);
  }

  configurationDefinition(name) {
    return cy.xpath(
      `//*[@data-testid="configuration-table"]//tbody/tr/td/parent::*/following-sibling::tr//*[@data-testid="configuration-name" and contains(text(), "${name}")]`
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
}
export default ConfigurationServicePage;
