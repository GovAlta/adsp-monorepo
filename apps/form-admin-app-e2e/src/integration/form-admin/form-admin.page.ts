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

  definitionsTableHeader() {
    return cy.xpath('//goa-table//thead//th[text()="Name"]');
  }

  definitionsTableFirstRow() {
    return cy.xpath('//goa-table//tbody//tr[1]');
  }

  selectFirstDefinitionButton() {
    return cy.xpath('//goa-table//tbody//tr[1]//goa-button').shadow().find('button');
  }

  definitionDetailHeading() {
    return cy.get('[data-testid="definition-heading"]');
  }

  responsesPageContent() {
    return cy.xpath('//goa-table//thead//th[contains(text(),"Created on") or contains(text(),"Status")]');
  }
}

export default FormAdminPage;
