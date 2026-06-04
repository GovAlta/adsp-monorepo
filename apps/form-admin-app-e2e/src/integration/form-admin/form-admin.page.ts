class FormAdminPage {
  formAdminAppHeader() {
    return cy.xpath('//h1[text()="Form"]//ancestor::div[@id="root"]//main//h2[text()="Overview"]');
  }

  loginButton() {
    return cy.get('#kc-login');
  }

  usernameEmailField() {
    return cy.get('[name=username]');
  }

  passwordField() {
    return cy.get('[name=password]');
  }

  formAdminLandingPageTitle() {
    return cy.get('goa-app-header[hasmenuclickhandler="false"]');
  }
}

export default FormAdminPage;
