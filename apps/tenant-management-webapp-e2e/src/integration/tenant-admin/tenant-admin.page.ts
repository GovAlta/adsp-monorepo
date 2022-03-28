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
    return cy.xpath('//nav[contains(@class, "sc")]//a[@title="Dashboard"]//preceding-sibling::div');
  }

  releaseContactInfo() {
    return cy.xpath('//*[@data-testid="beta-release"]');
  }

  tenantAutoLoginUrl() {
    return cy.xpath('//div[@class="copy-url"]');
  }

  clickToCopyButton() {
    return cy.get('button:contains("Click to copy")');
  }

  goaCardTitles() {
    return cy.xpath('//*[@data-testid="card-container"]/div/div/h2/a');
  }

  goaCardTexts() {
    return cy.xpath('//*[@data-testid="card-content"]/div[1]');
  }

  goaCardLink(text) {
    return cy.xpath(`//*[@data-testid="card-container"]/div/div/h2/a[contains(text(), "${text}")]`);
  }

  servicePageTitle(text) {
    return cy.xpath(`//h1[contains(text(), "${text}")]`);
  }

  roleInstructionParagragh() {
    return cy.xpath('(//h3[contains(text(), "Sharing tenant access")]/following-sibling::p)[2]'); // 2nd sibling paragrah of the title
  }

  hereLinkForManageUsers() {
    return cy.xpath('(//h3[contains(text(), "Sharing tenant access")]/following-sibling::p)[2]/a');
  }

  dashboardCalloutContenth3Title() {
    return cy.xpath('//*[@data-testid="callout-content"]/h3');
  }

  dashboardCalloutContentEmail() {
    return cy.xpath('//*[@data-testid="callout-content"]/p/a');
  }

  eventLogSearchBox() {
    return cy.get('input[name="searchBox"]');
  }

  eventLogMinTimeStamp() {
    return cy.get('input[name="timestampMin"]');
  }

  eventLogMaxTimesStamp() {
    return cy.get('input[name="timestampMax"]');
  }

  eventLogSearchBtn() {
    return cy.get('button:contains("Search")');
  }

  eventLogResetBtn() {
    return cy.get('button:contains("Reset")');
  }

  eventTableBody() {
    return cy.get('tbody');
  }

  eventTableShowDetailsBtn() {
    return cy.get('button:contains("Show details")');
  }

  eventLoadMoreBtn() {
    return cy.get('button:contains("Load more...")');
  }

  eventToggleDetailsIcons() {
    return cy.xpath('//*[@data-testid="toggle-details-visibility"]/div');
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
}
export default TenantAdminPage;
