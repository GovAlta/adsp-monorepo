class DashboardPage {
  title() {
    return cy.get('.name');
  }

  menuItem(menuItemKey: string) {
    const menuItemSelector = '[data-rb-event-key="' + menuItemKey + '"]';
    return cy.get(menuItemSelector);
  }

  servicesMenuCategory() {
    cy.contains('Services');
  }
}

export default DashboardPage;
