Feature: Subscription management

  @TEST_CS-442 @regression
  Scenario: As GoA staff, I can see an overview page for the subscription management
    When a user goes to subscription management overview site
    Then the user views the overview page of subscription management

  @accessibility @regression
  Scenario: As a user, I can see the subscription management page without any critical and serious accessibility issues
    When a user goes to subscription management overview site
    Then no critical or serious accessibility issues on "subscription management" page