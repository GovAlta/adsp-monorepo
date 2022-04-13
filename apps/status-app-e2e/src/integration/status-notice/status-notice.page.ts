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
    return cy.xpath('//*[@class="timezone-text"]');
  }

  allApplicationNoticeMessage(msg) {
    return cy.xpath(`//*[@data-testid="all-application-notice-message" and contains(text(), "${msg}")]`);
  }
}

export default ServiceStatusPage;
