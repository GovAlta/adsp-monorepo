class TenantAdminPage {
  dashboardTitle() {
    return cy.get('.name');
  }

  dashboardMenuItem(menuItemKey: string) {
    const menuItemSelector = `[data-rb-event-key="${menuItemKey}"]`;
    return cy.get(menuItemSelector);
  }

  dashboardServicesMenuCategory() {
    cy.contains('Services');
  }

  keycloakLink() {
    return cy.contains('Keycloak Admin');
  }
}

export default TenantAdminPage;
