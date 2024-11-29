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
    return cy.xpath('//*[@data-testid="contact-information-card"]//*[@data-testid="email-label"]//ancestor::p');
  }

  contactInformationPhoneNumber() {
    return cy.xpath('//*[@data-testid="contact-information-card"]//*[@data-testid="phone-number-label"]//ancestor::p');
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
    return cy.xpath('//*[@id="contactSupport"]//goa-callout');
  }

  editContactInformation() {
    return cy.get('[data-testid="edit-contact-button"]');
  }

  phoneNumberInput() {
    return cy.xpath('//goa-input[@name="sms"]');
  }

  emailInput() {
    return cy.get('[data-testid="contact-email-input"]');
  }

  contactInformationSaveBtn() {
    return cy.get('[data-testid="edit-contact-save-button"]');
  }

  phoneNumberFormItemWithError() {
    return cy.xpath('//label[text()="Phone number"]/following-sibling::div/goa-form-item[@error]');
  }

  emailFormItemWithError() {
    return cy.xpath('//label[text()="Email"]/following-sibling::div/goa-form-item[@error]');
  }

  preferredNotificationChannelGroup() {
    return cy.xpath('//goa-radio-group[@name="channel"]');
  }

  preferredNotificationPreferredChannelGroup() {
    return cy.xpath('//goa-radio-group[@name="preferredChannel"]');
  }

  preferredNotificationChannelDisplay() {
    return cy.xpath('//input[@type="radio" and @checked]');
  }

  availableChannel(subscriptionName) {
    return cy.xpath(
      `//tbody/tr/td[@data-testid="subscription-name" and text()="${subscriptionName}"]/following-sibling::td[2]`
    );
  }

  channelCheckedIcon(subscriptionName) {
    return cy.xpath(
      `//tbody/tr/td[@data-testid="subscription-name" and text()="${subscriptionName}"]/following-sibling::td[2]//div/div[@data-testid="icon-checked"]`
    );
  }

  notificationMessage() {
    return cy.get('goa-notification');
  }
}

export default SubscriptionManagementPage;
