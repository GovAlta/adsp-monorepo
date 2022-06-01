class ConfigurationServicePage {
  configurationOverviewContent() {
    return cy.xpath('//h1[text()="Configuration service"]/parent::main//p');
  }

  configurationSupportLink(text, link) {
    return cy.xpath(
      `//h1[text()="Configuration service"]/parent::main/following-sibling::aside//h3[text()="${text}"]/following-sibling::*[contains(text(), "${link}")]`
    );
  }
}
export default ConfigurationServicePage;
