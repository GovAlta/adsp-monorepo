class DirectoryServicePage {
  directoryOverviewContent() {
    return cy.xpath('//h1[text()="Directory service"]/parent::main//p');
  }

  directoryAsideItems(text, link) {
    return cy.xpath(
      `//h1[text()="Directory service"]/parent::main/following-sibling::aside//h3[text()="${text}"]/following-sibling::*[contains(text(), "${link}")]`
    );
  }

  directoryTable() {
    return cy.get('[data-testid="directory-table"]');
  }
}
export default DirectoryServicePage;
