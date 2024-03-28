class StatusAppPage {
  statusNotificationPleaseContact() {
    return cy.xpath('//*[@class="section-vs"]/a');
  }

  statusNotificationPageTitle() {
    return cy.get('h2[data-testid="service-name"]');
  }

  statusNotificationSignupDescription() {
    return cy.xpath('//h3[text()="Sign up for notifications"]/following-sibling::div/a');
  }

  applicationStatus(appName) {
    return cy.xpath(
      `//b[contains(text(),"${appName}")]/parent::div/following-sibling::div/div[@class="status-button"]/div`
    );
  }

  applicationStatusUpdatedTimestamp(appName) {
    return cy.xpath(
      `//b[contains(text(),"${appName}")]/ancestor::div[@class="flex-column"]//*[@data-testid="service-created-date"]`
    );
  }

  applicationNames() {
    return cy.xpath('//div[@class="title-line"]/following-sibling::div/div//b');
  }
}
export default StatusAppPage;
