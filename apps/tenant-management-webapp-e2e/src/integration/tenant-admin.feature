@REQ_CS-191 @tenant-admin
Feature: Tenant admin

  @TEST_CS-298 @REQ_CS-194 @dashboard @regression
  Scenario: As a GoA service owner, I can access the Tenant management webapp
    Given the user goes to tenant management login link
    When the user enters credentials and clicks login button
    Then the tenant management admin page is displayed

  # Administration menu is removed
  # @TEST_CS-299 @REQ_CS-194 @dashboard @regression
  # Scenario: As a GoA service owner, I can access the Administration module
  #   Given a service owner user is on tenant admin page
  #   When the user selects the "Administration" menu item
  #   Then the "administration" landing page is displayed

  @TEST_CS-300 @REQ_CS-194 @dashboard @regression
  Scenario: As a GoA service owner I can access the File Services module
    Given a service owner user is on tenant admin page
    When the user selects the "File Services" menu item
    Then the "file services" landing page is displayed

  @dashboard @regression
  Scenario: As a GoA service owner I can access the Service Status module
    Given a service owner user is on tenant admin page
    When the user selects the "Status" menu item
    Then the "service status" landing page is displayed

  @regression @smoke-test @api
  Scenario Outline: As a GoA service owner I can get a list of "<Options>"
    When the user sends a configuration service request to "<End Point>"
    Then the user gets a list of "<Options>"
    Examples:
      | Options               | End Point                             |
      | Service Options       | /api/configuration/v1/serviceOptions/ |
      | Tenant Configurations | /api/configuration/v1/tenantConfig/   |

  @TEST_CS-322 @regression
  Scenario: As a GoA service owner, I can access the realm administration from the Access section of the tenant admin portal to manage users
    Given a service owner user is on tenant admin page
    When the user selects the "Access" menu item
    Then the user views a link for the Keycloak admin
    And the keycloak admin link can open tenant admin portal in a new tab

  @TEST_CS-318 @REQ_CS-261 @regression
  Scenario: As a service owner, I can see the number of existing users in my Access service tenant
    Given a service owner user is on tenant admin page
    When the user selects the "Access" menu item
    Then the user views the number of users in its tenant realm
    And the number of users from admin page should equal to the number of users from the realm API

  @TEST_CS-320 @REQ_CS-262 @regression
  Scenario: As a service owner, I can see the number of users in roles in my Access service tenant
    Given a service owner user is on tenant admin page
    When the user selects the "Access" menu item
    Then the user views the number of users in top 5 roles in its tenant realm
    And the number of users in roles from admin page should equal to the number of users in roles from the realm API









