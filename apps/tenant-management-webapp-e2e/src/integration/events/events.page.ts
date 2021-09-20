class eventsPage {
  eventsOverviewh3Title() {
    return cy.xpath('//h2[contains(text(), Events)]/following-sibling::div[2]//h3');
  }

  event(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name"][contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"][contains(text(), "${eventName}")]`
    );
  }

  showDetailsIcon(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name"][contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"][contains(text(), "${eventName}")]/following-sibling::td//*[@data-testid="toggle-details-visibility"]/*[@data-testid="icon-eye"]`
    );
  }

  hideDetailsIcon(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name"][contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"][contains(text(), "${eventName}")]/following-sibling::td//*[@data-testid="toggle-details-visibility"]/*[@data-testid="icon-eyeOff"]`
    );
  }

  eventDetails(namespace, eventName) {
    return cy.xpath(
      `//div[@class="group-name"][contains(text(), "${namespace}")]/following-sibling::div//td[@data-testid="name"][contains(text(), "${eventName}")]/parent::tr/following-sibling::tr//*[@data-testid="details"]`
    );
  }
}

export default eventsPage;
