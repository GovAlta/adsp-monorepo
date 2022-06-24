class SubscriptionManagementPage {
  subscriptionManagementOverviewHeader() {
    return cy.xpath('//h1[text()="Subscription management"]//ancestor::main//h1[text()="Overview"]');
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

  serviceName() {
    return cy.get('[data-testid="service-name"]');
  }

  contactInformationEmail() {
    return cy.xpath(
      '//*[@data-testid="contact-information-card"]//*[@data-testid="email-label"]/label[text()="Email"]/following-sibling::p'
    );
  }

  subscriptionName(subscriptionName) {
    return cy.xpath(`//tbody/tr/td[@data-testid="subscription-name" and text()="${subscriptionName}"]`);
  }

  subscriptionRow(subscriptionName) {
    return cy.xpath(`//tbody/tr/td[@data-testid="subscription-name" and text()="${subscriptionName}"]/parent::tr`);
  }

  subscriptionDesc(subscriptionName) {
    return cy.xpath(
      `//tbody/tr/td[@data-testid="subscription-name" and text()="${subscriptionName}"]/following-sibling::td`
    );
  }

  contactSupportToUnsbuscribe(subscriptionName) {
    return cy.xpath(
      `//tbody/tr/td[@data-testid="subscription-name" and text()="${subscriptionName}"]/following-sibling::td/a[text()="Contact support to unsubscribe"]`
    );
  }

  contactSupportCalloutContent() {
    return cy.xpath('//*[@id="contactSupport"]//*[@data-testid="callout-content"]');
  }

  editContactInformation() {
    return cy.get('[data-testid="edit-contact-button"]');
  }

  phoneNumberInput() {
    return cy.get('[data-testid="contact-sms-input"]');
  }

  phoneNumberDisplay() {
    return cy.get('[data-testid=phone-number-label] > p');
  }

  emailInput() {
    return cy.get('[data-testid="contact-email-input"]');
  }

  emailDisplay() {
    return cy.get('[data-testid=email-label] > p');
  }

  contactInformationSaveBtn() {
    return cy.get('[data-testid="edit-contact-save-button"]');
  }

  phoneNumberErrorMsg() {
    return cy.xpath('//input[@data-testid="contact-sms-input"]/parent::*/following-sibling::div[@class="error-msg"]');
  }

  emailErrorMsg() {
    return cy.xpath('//input[@data-testid="contact-email-input"]/parent::*/following-sibling::div[@class="error-msg"]');
  }

  preferredNotificationChannelSelection(selection) {
    return cy.xpath(`//*[@class="goa-radio"]/input[@value="${selection}"]`);
  }

  preferredNotificationChannelDisplay() {
    return cy.xpath('//input[@type="radio" and @checked]');
  }

  calloutMessage() {
    return cy.xpath('//*[@role="notification"]//*[@class="message"]');
  }
}

export default SubscriptionManagementPage;
