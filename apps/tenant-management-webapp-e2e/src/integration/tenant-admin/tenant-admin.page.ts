class TenantAdminPage {
  dashboardTitle() {
    return cy.get('.name');
  }

  dashboardServicesMenuCategory() {
    return cy.contains('Services');
  }

  keycloakLink() {
    return cy.contains('Keycloak admin');
  }

  keycloakLinkOpenIcon() {
    return cy.xpath('//a[contains(text(), "Keycloak admin")]/goa-icon-button[@data-testid="open-icon"]');
  }

  userCount() {
    return cy.get('#user-count');
  }

  roleCount() {
    return cy.get('#role-count');
  }

  activeUserCount() {
    return cy.get('#active-user-count');
  }

  roleTableBody() {
    return cy.get('tbody');
  }

  roleTableHead() {
    return cy.get('thead');
  }

  tenantName() {
    return cy.xpath('//goa-side-menu/parent::div/preceding-sibling::div');
  }

  releaseContactInfo() {
    return cy.xpath('//*[@data-testid="beta-release"]');
  }

  tenantAutoLoginUrl() {
    return cy.xpath('//div[@class="copy-url"]');
  }

  copyLoginLinkButton() {
    return cy.xpath('//goa-button[@leadingicon="link"]');
  }

  copyLoginLinkButtonMessage() {
    return cy.xpath('//goa-button[@leadingicon="link"]');
  }

  goaCardTitles() {
    return cy.xpath('//goa-container//h2/a');
  }

  goaCardTexts() {
    return cy.xpath('//goa-container/div/div[contains(text(), ".")]');
  }

  goaCardLink(text) {
    return cy.xpath(`//goa-container//h2/a[contains(text(), "${text}")]`);
  }

  servicePageTitle(text) {
    return cy.xpath(`//h1[contains(text(), "${text}")]`);
  }

  roleInstructionParagragh() {
    return cy.xpath('(//h3[contains(text(), "Sharing tenant access")]/following-sibling::div//li[2])'); // 2nd paragraph with role instruction
  }

  hereLinkForManageUsers() {
    return cy.xpath(
      '(//h3[contains(text(), "Sharing tenant access")]/following-sibling::div//li[2]//a[text()="here"])'
    );
  }

  dashboardCallout() {
    return cy.xpath('//goa-callout');
  }

  dashboardCalloutContentEmail() {
    return cy.xpath('//goa-callout/p/a');
  }

  eventLogSearchBox() {
    return cy.get('input[name="searchBox"]');
  }

  eventLogMinTimeStamp() {
    return cy.get('input[name="timestampMin"]');
  }

  eventLogMaxTimeStamp() {
    return cy.get('input[name="timestampMax"]');
  }

  eventLogSearchBtn() {
    return cy.get('goa-button:contains("Search")');
  }

  eventLogResetBtn() {
    return cy.get('goa-button:contains("Reset")');
  }

  eventTableBody() {
    return cy.get('tbody');
  }

  eventTableShowDetailsBtn() {
    return cy.get('button:contains("Show details")');
  }

  eventLoadMoreBtn() {
    return cy.get('goa-button:contains("Load more")');
  }

  eventToggleDetailsIcons() {
    return cy.xpath('//*[@data-testid="toggle-details-visibility"]');
  }

  eventDetails() {
    return cy.xpath('//td[@class="event-details"]');
  }

  eventTableNameCells() {
    return cy.get('td[headers="name"]');
  }

  eventTableNameSpaceCells() {
    return cy.get('td[headers="namespace"]');
  }

  serviceRoleTableBody(tenantOrCore, serviceName) {
    return cy.xpath(
      `//*[contains(@data-testid,"${tenantOrCore}-service-role-id") and text()="${serviceName}"]/following-sibling::div//table[@data-testid="service-role-table"]/tbody`
    );
  }

  portraitModeMessage() {
    return cy.xpath('//h1[text()="Portrait mode is currently not supported"]');
  }
}
export default TenantAdminPage;
