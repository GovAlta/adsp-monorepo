Feature: Feedback

  @TEST_CS-3339 @REQ_CS-3019 @regression
  Scenario: As a tenant admin, I can see feedback overview
    Given a tenant admin user is on tenant admin page
    When the user selects the "Feedback" menu item
    Then the user views "description" section on feedback overview page
    And the user views "Sites" section on feedback overview page
    And the user views "Feedback widget" section on feedback overview page