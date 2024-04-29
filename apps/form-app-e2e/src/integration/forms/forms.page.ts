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

  formTextField(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]/goa-input[@type="text"]`);
  }

  formDateInput(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]/goa-input[@type="date"]`);
  }

  formDropdown(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]/goa-dropdown`);
  }

  formNextButton() {
    return cy.xpath('//goa-button[@data-testid="next-button"]');
  }

  formCheckbox(label) {
    return cy.xpath(`//goa-checkbox[@text="${label}"]`);
  }

  formSubmitButton() {
    return cy.xpath('//goa-button[@data-testid="stepper-submit-btn"]');
  }

  formObjectArrayButton() {
    return cy.xpath('//goa-button[contains(@data-testid, "object-array-toolbar")]');
  }

  formObjectArrayDependantTextField(label) {
    return cy.xpath(`//*[contains(@data-testid, "object-list-wrapper")]//goa-form-item[@label="${label}"]//goa-input`);
  }

  formObjectArrayDependantDateInput(label) {
    return cy.xpath(`//*[contains(@data-testid, "object-list-wrapper")]//goa-form-item[@label="${label}"]//goa-input`);
  }

  formSuccessCallout() {
    return cy.xpath('//goa-callout[@type="success"]');
  }

  formSummaryPageItems(pageName) {
    return cy.xpath(
      `//*[@data-testid="summary_step-content"]//h3[text()="Summary"]/following-sibling::div//div[text()="${pageName}"]/parent::div/following-sibling::div//div`
    );
  }

  //pageName is case sensitive and arrayName is lower case
  formSummaryPageOjectArrayItems(pageName, arrayName) {
    return cy.xpath(
      `//*[@data-testid="summary_step-content"]//h3[text()="Summary"]/following-sibling::div//div[text()="${pageName}"]/parent::div/following-sibling::div//h3[text()="${arrayName}"]/following-sibling::div/div`
    );
  }
}

export default FormsPage;
