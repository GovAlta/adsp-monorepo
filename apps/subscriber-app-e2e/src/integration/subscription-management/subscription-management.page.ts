class SubscriptionManagementPage {
  subscriptionManagementOverviewHeader() {
    return cy.xpath('//h1[text()="Subscription management"]//ancestor::main//h1[text()="Overview"]');
  }
}

export default SubscriptionManagementPage;
