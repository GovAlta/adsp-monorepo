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

  feebackSitesEditButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="feedbacks-sites-table"]//*[contains(@data-testid, "site-edit")])[${rowNumber}]`
    );
  }

  feebackSitesDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="feedbacks-sites-table"]//*[contains(@data-testid, "site-delete")])[${rowNumber}]`
    );
  }
}

export default feedbackPage;
