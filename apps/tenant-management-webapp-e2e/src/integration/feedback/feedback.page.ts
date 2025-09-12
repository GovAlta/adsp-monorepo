class feedbackPage {
  feedbackOverviewTab() {
    return cy.xpath('//*[@data-testid="feedbacks-overview-tab"]');
  }

  feedbackOverviewDescription() {
    return cy.xpath('//*[@data-testid="feedbacks-overview-tab"]//p[1]');
  }

  feedbackOverviewSitesContent() {
    return cy.xpath('//*[@data-testid="feedbacks-overview-tab"]//h2[text()="Sites"]/following-sibling::p');
  }

  feedbackOverviewFeedbackWidgetContent() {
    return cy.xpath('//*[@data-testid="feedbacks-overview-tab"]//h2[text()="Feedback widget"]/following-sibling::p');
  }

  feedbackSitesRegisterSiteButton() {
    return cy.xpath('//*[@data-testid="feedback-sites-tab"]//goa-button[@testid="add-site"]');
  }

  feedbackSitesSiteModalTitle() {
    return cy.xpath('//goa-modal[@testid="add-site-modal"]/div[@slot="heading"]');
  }

  feedbackSitesSiteModalAnonymousCheckbox() {
    return cy.xpath('//goa-modal[@testid="add-site-modal"]//goa-checkbox[@testid="anonymous-feedback"]');
  }

  feedbackSitesRegisterSiteModalHintText(hintText) {
    return cy.xpath(`//goa-modal[@testid="add-site-modal"]//div[text()="${hintText}"]`);
  }

  feedbackSitesSiteModalSiteUrl() {
    return cy.xpath('//goa-modal[@testid="add-site-modal"]//goa-input[@testid="feedback-url"]');
  }

  feedbackSitesSiteModalSiteUrlFormItem() {
    return cy.xpath('//goa-modal[@testid="add-site-modal"]//goa-form-item[@label="Site URL"]');
  }

  feedbackSitesRegisterSiteModalRegisterBtn() {
    return cy.xpath('//goa-modal[@testid="add-site-modal"]//goa-button[@testid="site-register"]');
  }

  feedbackSitesEditRegisteredSiteModalSaveBtn() {
    return cy.xpath('//goa-modal[@testid="add-site-modal"]//goa-button[@testid="site-edit"]');
  }

  feedbackSitesSiteModalCancelBtn() {
    return cy.xpath('//goa-modal[@testid="add-site-modal"]//goa-button[@testid="site-cancel"]');
  }

  feedbackSitesTableBody() {
    return cy.xpath('//table[@data-testid="feedbacks-sites-table"]/tbody');
  }

  feedbackSitesEditButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="feedbacks-sites-table"]//*[contains(@testid, "site-edit")])[${rowNumber}]`);
  }

  feedbackSitesDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="feedbacks-sites-table"]//*[contains(@testid, "site-delete")])[${rowNumber}]`
    );
  }

  feedbackBadge() {
    return cy.xpath('//div[@class="adsp-fb-badge"]');
  }

  feedbackStartModal() {
    return cy.xpath('//div[@class="adsp-fb-form-container adsp-fb-start" and @data-show="true"]');
  }

  feedbackMainModal() {
    return cy.xpath('//div[@class="adsp-fb-form-container adsp-fb-main" and @data-show="true"]');
  }

  feedbackStartModalCloseBtn() {
    return cy.xpath(
      '//div[@class="adsp-fb-form-container adsp-fb-start" and @data-show="true"]//img[@class="feedback-close-button"]'
    );
  }

  feedbackStartModalStartBtn() {
    return cy.xpath(
      '//div[@class="adsp-fb-form-container adsp-fb-start" and @data-show="true"]//button[contains(text(),"Start")]'
    );
  }

  feedbackMainModalRatingVeryDifficult() {
    return cy.xpath('//div[@class="rating-div"]/img[@alt="Very Difficult"]');
  }

  feedbackMainModalRatingDifficult() {
    return cy.xpath('//div[@class="rating-div"]/img[@alt="Difficult"]');
  }

  feedbackMainModalRatingVeryNeutral() {
    return cy.xpath('//div[@class="rating-div"]/img[@alt="Neutral"]');
  }

  feedbackMainModalRatingEasy() {
    return cy.xpath('//div[@class="rating-div"]/img[@alt="Easy"]');
  }

  feedbackMainModalRatingVeryEasy() {
    return cy.xpath('//div[@class="rating-div"]/img[@alt="Very Easy"]');
  }

  feedbackMainModalRating(ratingName) {
    return cy.xpath(`//div[@class="rating-div"]/img[@alt="${ratingName}"]`);
  }

  feedbackMainModalAdditionalCommentsLabel() {
    return cy.xpath('//div[@class="adsp-fb-content"]/div[@class="adsp-fb-form-comment"]/label/b');
  }

  feedbackMainModalAdditionalCommentsLabelRequiredOrOptional() {
    return cy.xpath('//div[@class="adsp-fb-content"]/div[@class="adsp-fb-form-comment"]/label/span');
  }

  feedbackMainModalAdditionalCommentsTextField() {
    return cy.xpath('//div[@class="adsp-fb-content"]/div[@class="adsp-fb-form-comment"]/textarea');
  }

  feedbackMainModalTechnicalIssuesLabel() {
    return cy.xpath('//div[@class="adsp-fb-content"]/div[@class="radio-container"]/label/b');
  }

  feedbackMainModalTechnicalIssuesLabelRequiredOrOptional() {
    return cy.xpath('//div[@class="adsp-fb-content"]/div[@class="radio-container"]/label/span');
  }

  feedbackMainModalTechnicalIssuesRadios() {
    return cy.xpath('//div[@class="adsp-fb-content"]/div[@class="radio-container"]/div[@class="radios"]');
  }

  feedbackMainModalTechnicalIssuesYesRadio() {
    return cy.xpath(
      '//div[@class="adsp-fb-content"]/div[@class="radio-container"]/div[@class="radios"]//input[@id="yes"]'
    );
  }

  feedbackMainModalTechnicalIssuesNoRadio() {
    return cy.xpath(
      '//div[@class="adsp-fb-content"]/div[@class="radio-container"]/div[@class="radios"]//input[@id="no"]'
    );
  }

  feedbackMainModalTechnicalIssuesTextField() {
    return cy.xpath('//div[@class="adsp-fb-content"]//textarea[@id="technicalComment"]');
  }

  feedbackMainModalCancelButton() {
    return cy.xpath('//div[@class="adsp-fb-actions"]//button[contains(text(), "Cancel")]');
  }

  feedbackMainModalSubmitButton() {
    return cy.xpath('//div[@class="adsp-fb-actions"]//button[contains(text(), "Submit")]');
  }

  feedbackMainModalSuccessMessage() {
    return cy.xpath('//h3[@class="h3-success"]');
  }

  feedbackMainModalSuccessMessageCloseBtn() {
    return cy.xpath('//button[@id="feedback-close-success"]');
  }

  feedbackFeedbackSitesDropdown() {
    return cy.xpath('//goa-dropdown[@testid="sites-dropdown"]');
  }

  feedbackFeedbackSitesDropdownItems() {
    return cy.xpath('//goa-dropdown[@testid="sites-dropdown"]/goa-dropdown-item');
  }

  feedbackSitesSiteURLs() {
    return cy.xpath('//table[@data-testid="feedbacks-sites-table"]/tbody/tr/td[@headers="Site"]');
  }

  feedbackFeedbackTableRows() {
    return cy.xpath('//table[@data-testid="feedback-table"]/tbody/tr');
  }

  feedbackFeedbackTableHeaders() {
    return cy.xpath('//table[@data-testid="feedback-table"]/thead/tr/th');
  }

  feedbackFeedbackTableHeadersExpandedView() {
    return cy.xpath(
      '//goa-button[text()="Back to default view"]/following-sibling::div//table[@data-testid="feedback-table"]/thead/tr/th'
    );
  }

  feedbackFeedbackTableSubmittedOnCells() {
    return cy.xpath('//table[@data-testid="feedback-table"]/tbody/tr/td[contains(@data-testid, "created-on")]');
  }

  feedbackFeedbackTableEyeIcons() {
    return cy.xpath('//table[@data-testid="feedback-table"]/tbody//goa-icon-button[@icon="eye"]');
  }

  feedbackFeedbackTableItemDetails() {
    return cy.xpath('//div[@data-testid="moredetails"]');
  }

  feedbackFeedbackExpandViewButton() {
    return cy.xpath('//goa-button[text()="Expand view"]');
  }

  feedbackFeedbackStartDateFilterExpandedView() {
    return cy.xpath(
      '//goa-button[text()="Back to default view"]/following-sibling::div//goa-input[@name="feedback-filter-start-date"]'
    );
  }

  feedbackFeedbackEndDateFilterExpandedView() {
    return cy.xpath(
      '//goa-button[text()="Back to default view"]/following-sibling::div//goa-input[@name="feedback-filter-end-date"]'
    );
  }

  feedbackFeedbackExportCSVExpandedView() {
    return cy.xpath(
      '//goa-button[text()="Back to default view"]/following-sibling::goa-button-group/goa-button[text()="Export CSV"]'
    );
  }

  feedbackFeedbackBackToDefaultViewButton() {
    return cy.xpath('//goa-button[text()="Back to default view"]');
  }

  feedbackFeedbackCollapseViewButtonExpendedView() {
    return cy.xpath('//goa-button[text()="Collapse view"]');
  }
}

export default feedbackPage;
