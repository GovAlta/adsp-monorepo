class BuilderAppPage {
  landingHeading() {
    return cy.get('h1, goa-app-header, [data-testid="landing-heading"]').first();
  }

  usernameField() {
    return cy.get('[name=username]');
  }

  passwordField() {
    return cy.get('[name=password]');
  }

  loginButton() {
    return cy.get('#kc-login');
  }
}

export default BuilderAppPage;
