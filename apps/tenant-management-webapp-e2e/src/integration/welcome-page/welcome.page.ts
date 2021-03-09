class WelcomePage {
  loginButton() {
    return cy.get('[value="Log In"]');
  }

  usernameEmailField() {
    return cy.get('[name=username]');
  }

  passwordField() {
    return cy.get('[name=password]');
  }
}

export default WelcomePage;
