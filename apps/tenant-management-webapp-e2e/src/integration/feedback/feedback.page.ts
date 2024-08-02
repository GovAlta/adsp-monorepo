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
}

export default feedbackPage;
