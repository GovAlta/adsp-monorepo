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
    return cy.xpath('//*[@data-testid="feedback-sites-tab"]//goa-button[@data-testid="add-site"]');
  }

  feedbackSitesSiteModalTitle() {
    return cy.xpath('//goa-modal[@data-testid="add-site-modal"]/div[@slot="heading"]');
  }

  feedbackSitesSiteModalAnonymousCheckbox() {
    return cy.xpath('//goa-modal[@data-testid="add-site-modal"]//goa-checkbox[@data-testid="anonymous-feedback"]');
  }

  feedbackSitesRegisterSiteModalHintText(hintText) {
    return cy.xpath(`//goa-modal[@data-testid="add-site-modal"]//div[text()="${hintText}"]`);
  }

  feedbackSitesSiteModalSiteUrl() {
    return cy.xpath('//goa-modal[@data-testid="add-site-modal"]//goa-input[@data-testid="feedback-url"]');
  }

  feedbackSitesSiteModalSiteUrlFormItem() {
    return cy.xpath('//goa-modal[@data-testid="add-site-modal"]//goa-form-item[@label="Site URL"]');
  }

  feedbackSitesRegisterSiteModalRegisterBtn() {
    return cy.xpath('//goa-modal[@data-testid="add-site-modal"]//goa-button[@data-testid="site-register"]');
  }

  feedbackSitesEditRegisteredSiteModalSaveBtn() {
    return cy.xpath('//goa-modal[@data-testid="add-site-modal"]//goa-button[@data-testid="site-edit"]');
  }

  feedbackSitesSiteModalCancelBtn() {
    return cy.xpath('//goa-modal[@data-testid="add-site-modal"]//goa-button[@data-testid="site-cancel"]');
  }

  feedbackSitesTableBody() {
    return cy.xpath('//table[@data-testid="feedbacks-sites-table"]/tbody');
  }

  feedbackSitesEditButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="feedbacks-sites-table"]//*[contains(@data-testid, "site-edit")])[${rowNumber}]`
    );
  }

  feedbackSitesDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="feedbacks-sites-table"]//*[contains(@data-testid, "site-delete")])[${rowNumber}]`
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
}

export default feedbackPage;
