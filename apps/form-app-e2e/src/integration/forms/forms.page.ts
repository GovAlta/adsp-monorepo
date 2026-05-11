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

  formTimeInput(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-input[@type="time"]`);
  }

  formDropdown(label) {
    return cy.xpath(`//goa-form-item[@label="${label}"]//goa-dropdown`);
  }

  formFileUploadButton(label) {
    return cy.xpath(
      `//goa-form-item[@label="${label}"]/following-sibling::div/goa-file-upload-input[@variant="button"]`
    );
  }

  formFileDragDropZone(label) {
    return cy.xpath(
      `//goa-form-item[@label="${label}"]/following-sibling::div/goa-file-upload-input[@variant="dragdrop"]`
    );
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

  formSummaryPageSectionRowValueError(pageName, label) {
    return cy.xpath(
      `//div[text()="${pageName}"]/ancestor::div[contains(@class,"review-section")]/goa-table/table/tbody/tr/td[1]//div[contains(text(), "${label}")]/ancestor::td//div[contains(@data-testid,"review-value")]/following-sibling::goa-form-item[@error]`
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

  formFullNameFirstNameField() {
    return cy.xpath(
      '//h3[text()="Full name"]//following-sibling::goa-container//goa-form-item[@label="First name"]/goa-input'
    );
  }

  formFullNameMiddleNameField() {
    return cy.xpath(
      '//h3[text()="Full name"]//following-sibling::goa-container//goa-form-item[@label="Middle name"]/goa-input'
    );
  }

  formFullNameLastNameField() {
    return cy.xpath(
      '//h3[text()="Full name"]//following-sibling::goa-container//goa-form-item[@label="Last name"]/goa-input'
    );
  }

  formFullNameDobFirstNameField() {
    return cy.xpath(
      '//h3[text()="Full name and date of birth"]//following-sibling::goa-container//goa-form-item[@label="First name"]/goa-input'
    );
  }

  formFullNameDobMiddleNameField() {
    return cy.xpath(
      '//h3[text()="Full name and date of birth"]//following-sibling::goa-container//goa-form-item[@label="Middle name"]/goa-input'
    );
  }

  formFullNameDobLastNameField() {
    return cy.xpath(
      '//h3[text()="Full name and date of birth"]//following-sibling::goa-container//goa-form-item[@label="Last name"]/goa-input'
    );
  }

  formFullNameDobDateOfBirthField() {
    return cy.xpath(
      '//h3[text()="Full name and date of birth"]//following-sibling::goa-container//goa-form-item[@label="Date of birth"]/goa-input'
    );
  }

  formAlbertaPostalAddressStreetField() {
    return cy.xpath(
      '//h3[text()="Alberta mailing address"]//following-sibling::goa-container//goa-form-item[@label="Street address or P.O. box"]//goa-input'
    );
  }

  formAlbertaPostalAddressCityField() {
    return cy.xpath(
      '//h3[text()="Alberta mailing address"]//following-sibling::goa-container//goa-form-item[@label="City"]/goa-input'
    );
  }

  formAlbertaPostalAddressPostalCodeField() {
    return cy.xpath(
      '//h3[text()="Alberta mailing address"]//following-sibling::goa-container//goa-form-item[@label="Postal code"]/goa-input'
    );
  }

  formCanadianPostalAddressStreetField() {
    return cy.xpath(
      '//h3[text()="Canadian mailing address"]//following-sibling::goa-container//goa-form-item[@label="Street address or P.O. box"]//goa-input'
    );
  }

  formCanadianPostalAddressCityField() {
    return cy.xpath(
      '//h3[text()="Canadian mailing address"]//following-sibling::goa-container//goa-form-item[@label="City"]/goa-input'
    );
  }

  formCanadianPostalAddressProvinceDropdown() {
    return cy.xpath(
      '//h3[text()="Canadian mailing address"]//following-sibling::goa-container//goa-form-item[@label="Province"]/goa-dropdown'
    );
  }

  formCanadianPostalAddressPostalCodeField() {
    return cy.xpath(
      '//h3[text()="Canadian mailing address"]//following-sibling::goa-container//goa-form-item[@label="Postal code"]/goa-input'
    );
  }
}

export default FormsPage;
