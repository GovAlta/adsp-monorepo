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

  formLandingPageSubtitle() {
    return cy.xpath('//h1/following-sibling::div');
  }

  formLandingPagePrimaryButton() {
    return cy.xpath('//goa-button[@type="primary"]');
  }

  formTextField(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-input[@type="text"]`);
  }

  formTextFieldFormItem(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]`);
  }

  formTextAreaField(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-textarea`);
  }

  formTextAreaFieldFormItem(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]`);
  }

  formNumericField(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-input[@type="number"]`);
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

  formSocialInsuranceNumberField() {
    return cy.xpath('//goa-form-item[@label="Social insurance number"]//goa-input');
  }

  formSubmitButton() {
    return cy.xpath('//goa-button[@type="primary" and text()="Submit"]');
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
      `//div[text()="${pageName}"]/parent::div/following-sibling::*//*[contains(@data-testid, "review-control")]`
    );
  }

  //pageName is case sensitive and arrayName is lower case
  formSummaryPageListWithDetailItems(pageName, arrayName) {
    return cy.xpath(
      `//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]/goa-table/table/tbody/tr/td[1]//div[contains(text(), "${arrayName}")]/ancestor::goa-table/table/tbody/tr/td/div[2]//div[@style="margin-bottom: 1.5rem;"]`
    );
  }

  formSummaryPageSectionRows(pageName) {
    return cy.xpath(
      `//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]/goa-table/table/tbody/tr`
    );
  }

  formSummaryPageSectionRowLabel(pageName, label) {
    return cy.xpath(
      `//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]/goa-table/table/tbody/tr/td[1]//div[contains(text(), "${label}")]`
    );
  }

  formSummaryPageSectionRowValue(pageName, label) {
    return cy.xpath(
      `//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]/goa-table/table/tbody/tr/td[1]//div[contains(text(), "${label}")]/ancestor::td//div[contains(@data-testid,"review-value")]`
    );
  }

  formSummaryPageValidationError(pageName, label) {
    return cy.xpath(
      `//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]//div[text()="${label}"]/ancestor::td//goa-form-item[@error]`
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

  formTitle() {
    return cy.get('goa-text[size="heading-xl"]');
  }

  formApplicationProgressText() {
    return cy.xpath('//h3[text()="Application Progress"]/following-sibling::div[1]/div[1]');
  }

  formTaskLink(taskName) {
    return cy.xpath(`//a[@href and text()="${taskName}"]`);
  }

  formTaskStatus(taskName) {
    return cy.xpath(`//a[@href and text()="${taskName}"]/parent::td/following-sibling::td//goa-badge`);
  }

  formStepIndicator() {
    return cy.xpath('//h3[contains(text(),"Step")]');
  }

  formBackToOverviewLink() {
    return cy.xpath('//div[@class="back-link" and text()="Back to application overview"]');
  }

  formTaskListStepPageNextButton() {
    return cy.xpath('//goa-button[@testid="pages-save-continue-btn"]');
  }

  formTaskListAllLinks() {
    return cy.xpath('//tbody//a[@href]');
  }

  formSectionTitle(sectionTitle) {
    return cy.xpath(`//tbody/tr/td/goa-text [text()="${sectionTitle}"]`);
  }
}

export default FormsPage;
