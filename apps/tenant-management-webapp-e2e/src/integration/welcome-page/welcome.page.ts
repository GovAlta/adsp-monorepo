class WelcomePage {
  signinButton() {
    return cy.get('button:contains("Sign In")');
  }

  usernameEmailField() {
    return cy.get('[name=username]');
  }

  passwordField() {
    return cy.get('[name=password]');
  }
}

export default WelcomePage;
