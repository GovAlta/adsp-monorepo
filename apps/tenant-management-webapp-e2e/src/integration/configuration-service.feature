@configuration-service
Feature: Configuration-service

  @TEST_CS-1326 @REQ_CS-1120, @regression
  Scenario: As a tenant admin, I can see the Configuration service overview, so I know that it is available
    Given a tenant admin user is on tenant admin page
    When the user selects the "Configuration" menu item
    Then the user views the Configuration service overview content "The configuration service provides"
    Then the user views the link for "Configuration service" API docs
    And the user views the link for "configuration-service" See the code
    And the user views the link for Configuration service under "Support" as "Get support"
