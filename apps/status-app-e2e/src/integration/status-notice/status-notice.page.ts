class ServiceStatusPage {
  goaMicrositeHeader() {
    return cy.get('goa-microsite-header[type="live"]');
  }

  goaOfficialSiteHeader() {
    return cy.get('goa-app-header');
  }

  statusPageTitle() {
    return cy.get('goa-app-header');
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
