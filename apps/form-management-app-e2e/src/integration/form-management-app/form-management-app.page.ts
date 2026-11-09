class FormManagementAppPage {
  loginButton() {
    return cy.get('#kc-login');
  }

  usernameField() {
    return cy.get('[name=username]');
  }

  passwordField() {
    return cy.get('[name=password]');
  }

  appHeader() {
    return cy.get('goa-app-header');
  }

  formDefinitionsList() {
    return cy.get('table, [data-testid="definitions-table"], goa-table').first();
  }

  formFiltersContent() {
    return cy.get('main, [data-testid="filters-content"]').first();
  }

  overviewContent() {
    return cy.get('main').first();
  }
}

export default FormManagementAppPage;
