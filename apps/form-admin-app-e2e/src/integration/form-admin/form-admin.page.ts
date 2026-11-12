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

  clearFiltersButton() {
    return cy
      .get('goa-button')
      .filter(
        (_index, button) =>
          button.getAttribute('testid') === 'clear-filters' || button.textContent?.trim() === 'Clear filters'
      )
      .shadow()
      .find('button');
  }

  definitionDetailHeading() {
    return cy.get('[data-testid="definition-heading"]');
  }

  responsesPageContent() {
    return cy.xpath('//table//thead//th[contains(.,"Created on") or contains(.,"Status")]');
  }
}

export default FormAdminPage;
