class TenantAdminPage {
  dashboardTitle() {
    return cy.get('.name');
  }

  dashboardMenuItem(menuItemKey: string) {
    const menuItemSelector = `nav > div > [href="${menuItemKey}"] > span`;
    return cy.get(menuItemSelector);
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
}

export default TenantAdminPage;
