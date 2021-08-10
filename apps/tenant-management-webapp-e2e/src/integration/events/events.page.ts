class eventsPage {
  eventTab(text) {
    return cy.xpath(
      `//h2[contains(text(),"Events")]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
    );
  }

  eventsOverviewTitle() {
    return cy.xpath('//h2[contains(text(), Events)]/following-sibling::div[2]//h3');
  }
}

export default eventsPage;
