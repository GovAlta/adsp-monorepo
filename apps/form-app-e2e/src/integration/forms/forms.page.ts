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
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-input[@type="date"]`);
  }

  formDropdown(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-dropdown`);
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
    return cy.xpath(`//*[contains(@data-testid, "object-list-wrapper")]//goa-form-item[@label="${label}"]//goa-input`);
  }

  formListWithDetailContinueButton() {
    return cy.xpath('//*[contains(@data-testid, "object-list-wrapper")]//goa-button[@testid="next-list-button"]');
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
      `//*[@data-testid="summary_step-content"]//h3[text()="Summary"]/following-sibling::div//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]/goa-table/table/tbody/tr/td[1]//div[contains(text(), "${arrayName}")]/ancestor::td//goa-table/table/tbody/tr`
    );
  }

  formSummaryPageSectionRows(pageName) {
    return cy.xpath(
      `//*[@data-testid="summary_step-content"]//h3[text()="Summary"]/following-sibling::div//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]/goa-table/table/tbody/tr`
    );
  }

  formSummaryPageSectionRowLabel(pageName, label) {
    return cy.xpath(
      `//*[@data-testid="summary_step-content"]//h3[text()="Summary"]/following-sibling::div//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]/goa-table/table/tbody/tr/td[1]//div[contains(text(), "${label}")]`
    );
  }

  formSummaryPageSectionRowValue(pageName, label) {
    return cy.xpath(
      `//*[@data-testid="summary_step-content"]//h3[text()="Summary"]/following-sibling::div//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]/goa-table/table/tbody/tr/td[1]//div[contains(text(), "${label}")]/ancestor::td//div[contains(@data-testid,"review-value")]`
    );
  }

  formSummaryPageValidationError(pageName, label) {
    return cy.xpath(
      `//*[@data-testid="summary_step-content"]//h3[text()="Summary"]/following-sibling::div//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]//div[text()="${label}"]/ancestor::td//goa-icon[@type="warning"]/parent::div`
    );
  }

  formRadioGroup(question) {
    return cy.xpath(`//goa-form-item[@label="${question}"]//goa-radio-group`);
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
