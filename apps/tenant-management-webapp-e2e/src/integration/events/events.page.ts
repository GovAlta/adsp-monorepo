class eventsPage {
  eventsOverviewh3Title() {
    return cy.xpath('//h2[contains(text(), Events)]/following-sibling::div[2]//h3');
  }
}

export default eventsPage;
