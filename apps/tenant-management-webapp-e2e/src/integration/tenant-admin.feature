@REQ_CS-191 @tenant-admin
Feature: Tenant admin

  @TEST_CS-298 @REQ_CS-194 @dashboard @smoke-test @regression
  Scenario: As a GoA service owner, I can access the Tenant management webapp
    Given the user goes to tenant management login link
    When the user enters credentials and clicks login button
    Then the tenant management admin page is displayed

  @TEST_CS-300 @REQ_CS-194 @regression
  Scenario Outline: As a GoA service owner I can access "<Page Title>"
    Given a service owner user is on tenant admin page
    When the user selects the "<Menu>" menu item
    Then the "<Page Title>" landing page is displayed
    Examples:
      | Menu          | Page Title     |
      | File Services | File Services  |
      | Status        | Service Status |
      | Event log     | Event log      |


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

  @accessibility @regression
  Scenario: As a service owner, I can use the tenant admin dashboard without any critical or serious accessibility issues
    Given a service owner user is on tenant admin page
    Then no critical or serious accessibility issues on "tenant admin dashboard page"


  @accessibility @regression
  Scenario: As a service owner, I can use the tenant admin access page without any critical or serious accessibility issues
    Given a service owner user is on tenant admin page
    When the user selects the "Access" menu item
    Then no critical or serious accessibility issues on "tenant admin access page"

  @TEST_CS-588 @TEST_CS-745 @dashboard @regression
  Scenario: As a GoA admin user, I should be able to see useful information on the landing page
    Given a service owner user is on tenant admin page
    Then the user views the tenant name of "autotest"
    And the user views the release info and DIO contact info
    And the user views an instruction of role requirement indicating user needs tenant-admin
    And the user views the autologin link with a copy button
    # Getting content from clipboard doesn't work on build agent. Commented out this validation.
    # When the user clicks click to copy button
    # Then the autologin link is copied to the clipboard
    And the user views introductions and links for "Access", "File Service", "Status" and "Events"
    When the user clicks "Access" link
    Then the user is directed to "Access" page
    When the user selects the "Dashboard" menu item
    And the user clicks "File Service" link
    Then the user is directed to "File Service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Status" link
    Then the user is directed to "Status" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Events" link
    Then the user is directed to "Events" page

  @TEST_CS-743 @regression
  Scenario: As a non-tenant admin, I cannot access the tenant admin application and am directed to the tenant creator for access, so that I know how to get access
    Given the user goes to tenant management login link
    When the user enters "env{email2}" and "env{password2}", and clicks login button
    Then the user views a message stating the user needs administrator role for the tenant to access the app and that they can contact the tenant creator of "env{realmOwner}"
    Then the user should not have regular admin view



