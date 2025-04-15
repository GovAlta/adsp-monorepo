@cache
Feature: Calendar

  @TEST_CS-4036 @REQ_CS-3620 @regression
  Scenario: As a tenant admin, I can see the cache service overview in tenant admin view
    Given a tenant admin user is on tenant admin page
    When the user selects the "Cache" menu item
    Then the user views the "Cache service" overview content "Cache service provides"
    And the user views "Cache targets" section on cache overview page
    And the user views the link of API docs for "Cache service"
    And the user views the link of See the code for "cache-service"
    And the user views the link of "Get support" under Support