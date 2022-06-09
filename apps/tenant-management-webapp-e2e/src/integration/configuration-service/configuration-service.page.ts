class ConfigurationServicePage {
  configurationOverviewContent() {
    return cy.xpath('//h1[text()="Configuration service"]/parent::main//p');
  }
}
export default ConfigurationServicePage;
