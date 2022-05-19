@configuration-service
Feature: Configuration-service

  @TEST_CS-1326 @REQ_CS-1120, @regression
  Scenario: As a tenant admin, I can see the Configuration service overview, so I know that it is available
    Given a tenant admin user is on tenant admin page
    When the user selects the "Configuration" menu item
    Then the user views the Configuration service overview content "The configuration service provides"
    And the user views the item "Support" with the aside item link "Get support"
    And the user views the item "Helpful Links" with the aside item link "Read the API docs"
    And the user views the item "Helpful Links" with the aside item link "See the code"