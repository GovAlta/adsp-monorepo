class DirectoryServicePage {
  directoryOverviewContent() {
    return cy.xpath('//h1[text()="Directory service"]/parent::main//p');
  }

  directoryAsideItem(text) {
    return cy.xpath(
      `//h1[text()="Directory service"]/parent::main/following-sibling::aside//*[contains(text(), "${text}")]`
    );
  }

  directoryTable() {
    return cy.get('[data-testid="directory-table"]');
  }
}
export default DirectoryServicePage;
