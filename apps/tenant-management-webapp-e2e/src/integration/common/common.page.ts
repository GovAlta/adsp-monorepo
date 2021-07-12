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

  adminMenuItem(menuItemKey: string) {
    const menuItemSelector = `nav > div > [href="${menuItemKey}"] > span`;
    return cy.get(menuItemSelector);
  }
}

export default Common;
