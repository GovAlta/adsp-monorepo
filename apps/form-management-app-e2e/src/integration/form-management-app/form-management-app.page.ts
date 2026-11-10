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

  dashboardHeading() {
    return cy.get('main h1');
  }

  formDefinitionsList() {
    return cy.get('main table').first();
  }

  formFiltersContent() {
    return cy.contains('main h1', 'Form Filters');
  }

  overviewContent() {
    return cy.get('main').first();
  }
}

export default FormManagementAppPage;
