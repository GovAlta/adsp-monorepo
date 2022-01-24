class ServiceStatusPage {
  goaMicrositeHeader() {
    return cy.xpath('//div[@class="goa-header goa-microsite-header"]');
  }

  goaOfficialSiteHeader() {
    return cy.xpath('//*[@class="goa-header goa-official-site-header"]');
  }

  statusPageTitle() {
    return cy.get('.name');
  }

  applicationStatus(appTitle) {
    return cy.xpath(
      `//b[contains(text(),"${appTitle}")]/parent::div/following-sibling::div/div[@class="status-button"]/div`
    );
  }

  timezoneInfo() {
    return cy.xpath('//*[@class="timezone"]/i');
  }
}

export default ServiceStatusPage;
