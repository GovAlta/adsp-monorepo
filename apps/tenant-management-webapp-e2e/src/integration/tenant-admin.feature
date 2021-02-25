
@REQ_CS-191 @tenant-admin
Feature: Tenant admin

  @TEST_CS-298 @REQ_CS-194 @dashboard @regression @smoke-test
  Scenario: As a GoA service owner, I can access the Tenant management webapp
    # Given the user is a GoA service owner     // no Given as login is not working yet
    When the user visits the tenant management webapp
    Then the landing page is displayed

  @TEST_CS-299 @REQ_CS-194 @dashboard @regression
  Scenario: As a GoA service owner, I can access the Administration module
    Given the user is in the tenant management webapp
    When the user selects the "Administration" menu item
    Then the "administration" landing page is displayed

  @TEST_CS-300 @REQ_CS-194 @dashboard @regression
  Scenario: As a GoA service owner I can access the File Services module
    Given the user is in the tenant management webapp
    When the user selects the "File Services" menu item
    Then the "file services" landing page is displayed

  @regression @smoke-test @api
  Scenario Outline: As a GoA service owner I can get a list of "<Options>"
    When the user sends a configuration service request to "<End Point>"
    Then the user gets a list of configuration options
    Examples:
      | Options               | End Point                             |
      | Service Options       | /api/configuration/v1/serviceOptions/ |
      | Tenant Configurations | /api/configuration/v1/tenantConfig/   |












