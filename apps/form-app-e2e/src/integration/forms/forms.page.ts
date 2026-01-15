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
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-input[@type="text"]`);
  }

  formDateInput(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-date-picker`);
  }

  formDropdown(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//div[contains(@data-testid, "dropdown")]`);
  }

  formNextButton() {
    return cy.xpath('//goa-button[@testid="next-button"]');
  }

  formCheckbox(label) {
    return cy.xpath(`//goa-checkbox[@text="${label}"]`);
  }

  formSubmitButton() {
    return cy.xpath('//goa-button[@testid="stepper-submit-btn"]');
  }

  formListWithDetailButton(label) {
    return cy.xpath(`//goa-button[contains(@testid, "object-array-toolbar") and text()="${label}"]`);
  }

  formListWithDetailDependantTextField(label) {
    return cy.xpath(`//*[contains(@data-testid, "object-list-wrapper")]//goa-form-item[@label="${label}"]//goa-input`);
  }

  formListWithDetailDependantDateInput(label) {
    return cy.xpath(`//*[contains(@data-testid, "object-list-wrapper")]//goa-form-item[@label="${label} "]//goa-input`);
  }

  formSuccessCallout() {
    return cy.xpath('//goa-callout[@type="success"]');
  }

  formSummaryPageControlValues(pageName) {
    return cy.xpath(
      `//*[@data-testid="summary_step-content"]//h3[text()="Summary"]/following-sibling::div//div[text()="${pageName}"]/parent::div/following-sibling::*//*[contains(@data-testid, "review-control")]`
    );
  }

  //pageName is case sensitive and arrayName is lower case
  formSummaryPageListWithDetailItems(pageName, arrayName) {
    return cy.xpath(
      `//*[@data-testid="summary_step-content"]//h3[text()="Summary"]/following-sibling::div//div[text()="${pageName}"]/parent::div/following-sibling::div//h3[text()="${arrayName}"]/following-sibling::div/div`
    );
  }

  formRadioGroup(question) {
    return cy.xpath(`//goa-form-item[@label="${question}"]//goa-radio-group`);
  }

  formFieldFormItem(label) {
    return cy.xpath(`//h3[text()="Summary"]/following-sibling::div//goa-form-item[@label="${label}"]`);
  }

  formSummaryPagePDFDownloadLinkIcon() {
    return cy.xpath(
      '//div[@class="link"]/div[text()="Download PDF copy"]/following-sibling::goa-icon-button[@icon="download"]'
    );
  }

  formNotAvailableCallout() {
    return cy.xpath('//goa-callout[contains(@heading,"Form not available")]');
  }

  ProcessingYourApplicationCallout() {
    return cy.xpath('//goa-callout[contains(@heading,"We\'re processing your application") and @type="success"]');
  }
}

export default FormsPage;
