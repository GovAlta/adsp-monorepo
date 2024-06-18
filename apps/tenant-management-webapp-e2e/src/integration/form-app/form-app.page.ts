class FormAppPage {
  loginButton() {
    return cy.get('#kc-login');
  }

  usernameEmailField() {
    return cy.get('[name=username]');
  }

  passwordField() {
    return cy.get('[name=password]');
  }

  formTextField(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]/goa-input[@type="text"]`);
  }

  formSubmitButton() {
    return cy.xpath('//goa-button[text()="Submit"]');
  }
}

export default FormAppPage;
