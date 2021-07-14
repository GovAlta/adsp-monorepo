class ServiceStatusPage {
  goaMicrositeHeader() {
    return cy.xpath('//div[@class="goa-header goa-microsite-header"]');
  }

  goaOfficialSiteHeader() {
    return cy.xpath('//header[@class="goa-header goa-official-site-header"]');
  }

  statusPageTitle() {
    return cy.get('h1');
  }
}

export default ServiceStatusPage;
