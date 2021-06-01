class Common {
  loginButton() {
    return cy.get('#kc-login');
  }

  usernameEmailField() {
    return cy.get('[name=username]');
  }

  passwordField() {
    return cy.get('[name=password]');
  }

  tenantLoginButton() {
    return cy.get('button:contains("Login")');
  }
}

export default Common;
