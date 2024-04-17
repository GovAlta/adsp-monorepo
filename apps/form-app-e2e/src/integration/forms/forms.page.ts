class FormsPage {
  formAppOverviewHeader() {
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

  formStartApplicationSubtitle() {
    return cy.xpath(
      '//h1[text()="Start a new application"]/following-sibling::div[contains(text(), "Start your application for")]'
    );
  }
}

export default FormsPage;
