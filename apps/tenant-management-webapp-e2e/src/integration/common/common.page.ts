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

  readTheApiDocsLink() {
    return cy.xpath(
      '//*[contains(text(), "Helpful Links")]/following-sibling::a[contains(text(), "Read the API docs")]'
    );
  }

  APIDocsPageTitle(text) {
    return cy.xpath(`//*[@class="title" and contains(text(), "${text}")]`);
  }

  serviceTab(service, text) {
    return cy.xpath(
      `//h2[contains(text(),"${service}")]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
    );
  }
}

export default Common;
