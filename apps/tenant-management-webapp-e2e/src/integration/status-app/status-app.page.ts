class StatusAppPage {
  statusNotificationPleaseContact() {
    return cy.xpath('//*[@class="section-vs"]/a');
  }

  statusNotificationSignupDescription() {
    return cy.xpath('//h3[text()="Sign up for notifications"]/following-sibling::div/a');
  }
}
export default StatusAppPage;
