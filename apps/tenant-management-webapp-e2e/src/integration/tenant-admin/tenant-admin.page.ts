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
    return cy.xpath('//div[@class="goa-card"]//div[@class="goa-title"]//a');
  }

  goaCardTexts() {
    return cy.xpath('//div[@class="goa-card"]//*[@class="goa-text"]');
  }

  goaCardLink(text) {
    return cy.xpath(`//div[@class="goa-title"]//a[contains(text(), "${text}")]`);
  }

  servicePageTitle(text) {
    return cy.xpath(`//h2[contains(text(), "${text}")]`);
  }
}

export default TenantAdminPage;
