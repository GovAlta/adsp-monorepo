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
}
export default StatusAppPage;
