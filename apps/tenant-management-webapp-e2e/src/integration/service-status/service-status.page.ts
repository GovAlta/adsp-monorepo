class StatusServicePage {
  statusTabs() {
    return cy.xpath('//h2[contains(text(), "Service status")]/following-sibling::div[1]//descendant::div');
  }

  statusTab(text: string) {
    return cy.xpath(
      `//h2[contains(text(), "Service status")]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
    );
  }

  guidelinesTitle() {
    return cy.xpath('//div[contains(text(), "Guidelines for")]');
  }
}

export default StatusServicePage;
