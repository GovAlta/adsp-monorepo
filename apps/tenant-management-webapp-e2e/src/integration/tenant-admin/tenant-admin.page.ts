class TenantAdminPage {
  dashboardTitle() {
    return cy.get('.name');
  }

  dashboardServicesMenuCategory() {
    return cy.contains('Services');
  }

  keycloakLink() {
    return cy.contains('Keycloak Admin');
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
    return cy.xpath('//*[@data-testid="card-container"]/div/h3/a');
  }

  goaCardTexts() {
    return cy.xpath('//*[@data-testid="card-content"]/div');
  }

  goaCardLink(text) {
    return cy.xpath(`//*[@data-testid="card-container"]/div/h3/a[contains(text(), "${text}")]`);
  }

  servicePageTitle(text) {
    return cy.xpath(`//h2[contains(text(), "${text}")]`);
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
}

export default TenantAdminPage;
