@configuration-service
Feature: Configuration-service

  @TEST_CS-1326 @REQ_CS-1120, @regression
  Scenario: As a tenant admin, I can see the Configuration service overview, so I know that it is available
    Given a tenant admin user is on tenant admin page
    When the user selects the "Configuration" menu item
    Then the user views the Configuration service overview content "The configuration service provides"
    And the user views the link of API docs for "Configuration service"
    And the user views the link of See the code for "configuration-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-1357 @REQ_CS-1272, @regression
  Scenario: As a tenant admin, I can see the core configuration definitions, so I understand how they are used.
    Given a tenant admin user is on tenant admin page
    When the user selects the "Configuration" menu item
    Then the user views the Configuration service overview content "The configuration service provides"
    When the user selects "Definitions" tab for "Configuration"
    Then the user views a heading of "platform" namespace
    And the user views a "file-service" under core-service configurations
    When the user clicks eye icon of "file-service" under Platform to view the schema
    Then the user "views" the schema of file-service
    And the user validate partial content "readRoles" of file service schema
    When the user clicks eye-off icon of "file-service" under Platform to close the schema
    Then the user "should not view" the schema of file-service
