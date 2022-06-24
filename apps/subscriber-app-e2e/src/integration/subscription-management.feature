Feature: Subscription management

  @TEST_CS-442 @smoke-test
  Scenario: As GoA staff, I can see an overview page for the subscription management
    When a user goes to subscription management overview site
    Then the user views the overview page of subscription management

  @accessibility @regression
  Scenario: As a user, I can see the subscription management page without any critical and serious accessibility issues
    When a user goes to subscription management overview site
    Then no critical or serious accessibility issues on "subscription management" page

  @TEST_CS-995 @REQ_CS-915 @TEST_CS-1248 @REQ_CS-1040 @REQ_CS-1502 @regression
  Scenario: As an authenticated stakeholder, I can login to see non-self-serve subscriptions
    When an authenticated user is in the subscriber app
    Then the user views subscription management page
    And the user views the user contact information
    And the user views the subscription of "Application health check change" and its description
    And the user views the support link for the scription of "Application health check change"