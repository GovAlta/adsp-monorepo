@REQ_CS-191 @tenant-admin
Feature: Tenant admin

  @TEST_CS-298 @REQ_CS-194 @dashboard @smoke-test @regression
  Scenario: As a tenant admin, I can access the Tenant management webapp
    Given the user goes to tenant management login link
    When the user enters credentials and clicks login button
    Then the tenant management admin page is displayed

  @TEST_CS-300 @REQ_CS-194 @regression
  Scenario Outline: As a tenant admin, I can access "<Page Title>"
    Given a tenant admin user is on tenant admin page
    When the user selects the "<Menu>" menu item
    Then the "<Page Title>" landing page is displayed
    Examples:
      | Menu      | Page Title     |
      | File      | File service   |
      | Status    | Status service |
      | Event log | Event log      |

  @regression @smoke-test @api @ignore
  Scenario Outline: As a tenant admin, I can get a list of "<Options>"
    When the user sends a configuration service request to "<End Point>"
    Then the user gets a list of "<Options>"
    Examples:
      | Options               | End Point                             |
      | Service Options       | /api/configuration/v1/serviceOptions/ |
      | Tenant Configurations | /api/configuration/v1/tenantConfig/   |

  # TEST DATA: the automation user needs to have realm management roles
  @TEST_CS-322 @regression
  Scenario: As a tenant admin, I can access the realm administration from the Access section of the tenant admin portal to manage users
    Given a tenant admin user is on tenant admin page
    When the user selects the "Access" menu item
    Then the user views a link for the Keycloak admin
    And the keycloak admin link can open tenant admin portal in a new tab

  @TEST_CS-318 @REQ_CS-261 @regression
  Scenario: As a tenant admin, I can see the number of existing users and roles in my Access service tenant
    Given a tenant admin user is on tenant admin page
    When the user selects the "Access" menu item
    Then the user views the number of users in its tenant realm
    And the number of users from admin page should equal to the number of users from the realm API

  @TEST_CS-320 @REQ_CS-262 @regression
  Scenario: As a tenant admin, I can see the number of users in roles in my Access service tenant
    Given a tenant admin user is on tenant admin page
    When the user selects the "Access" menu item
    Then the user views the number of users in top 5 roles in its tenant realm
    And the number of users in roles from admin page should equal to the number of users in roles from the realm API

  @accessibility @regression
  Scenario: As a tenant admin, I can use tenant admin pages without any critical or serious accessibility issues
    Given a tenant admin user is on tenant admin page
    When the user selects the "Access" menu item
    Then no critical or serious accessibility issues on "tenant admin access overview page"
    When the user selects "Service roles" tab for "Access"
    When the user waits "4" seconds
    Then no critical or serious accessibility issues on "tenant admin access service roles page"
    When the user selects the "Event log" menu item
    Then no critical or serious accessibility issues on "tenant admin event log page"
  # CS-4519 - dropdown controls have accessibility issues
  # When the user selects the "Service metrics" menu item
  # Then no critical or serious accessibility issues on "tenant admin service metrics page"
  # Copy link component has accessibility issue and need to address by UI component team before we can run accessibility test against Dashboard
  # When the user selects the "Dashboard" menu item
  # Then no critical or serious accessibility issues on "tenant admin dashboard page"

  @TEST_CS-588 @TEST_CS-745 @dashboard @regression @prod
  Scenario: As a tenant admin, I should be able to see useful information on the landing page
    Given a tenant admin user is on tenant admin page
    Then the user views the tenant name of "autotest"
    And the user views the link of "Get support" under Support
    And the user views an instruction of role requirement indicating user needs tenant-admin
    When the user clicks Copy login link
    Then the user views the message of "Copy link" from clicking Copy login link
    # Getting content from clipboard doesn't work on build agent. Commented out this validation.
    # Then the login link is copied to the clipboard
    And the user views introductions and links for "Access", "Cache", "Calendar", "Comment", "Configuration", "Directory", "Event", "Feedback", "File", "Form", "Notification", "PDF", "Script", "Status", "Task", "Value"
    When the user clicks "Access" link
    Then the user is directed to "Access service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Cache" link
    Then the user is directed to "Cache service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Calendar" link
    Then the user is directed to "Calendar service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Comment" link
    Then the user is directed to "Comment service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Feedback" link
    Then the user is directed to "Feedback service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "File" link
    Then the user is directed to "File service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Form" link
    Then the user is directed to "Form service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Status" link
    Then the user is directed to "Status service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Event" link
    Then the user is directed to "Event service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "PDF" link
    Then the user is directed to "PDF service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Configuration" link
    Then the user is directed to "Configuration service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Script" link
    Then the user is directed to "Script service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Task" link
    Then the user is directed to "Task service" page
    When the user selects the "Dashboard" menu item
    And the user clicks "Value" link
    Then the user is directed to "Value service" page

  # TEST DATA: need a user without tenant admin role
  @TEST_CS-743 @regression
  Scenario: As a non-tenant admin, I cannot access the tenant admin application and am directed to the tenant creator for access, so that I know how to get access
    Given the user goes to tenant management login link
    When the user enters "env{email2}" and "env{password2}", and clicks login button
    Then the user views a message stating the user needs administrator role for the tenant to access the app and that they can contact the tenant creator of "env{realmOwner}"
    Then the user should not have regular admin view

  @TEST_CS-715 @REQ_CS-254 @regression @prod
  Scenario: As a tenant admin, I can search the event log, so I can find events of interest
    Given a tenant admin user is on tenant admin page
    # First create an event definition under events it will be used to verify the event log
    When the user selects the "Event" menu item
    And the user selects "Definitions" tab for "Event"
    And the user clicks Add definition button on event definitions page
    Then the user views Add definition dialog
    When the user enters "Autotest" in Namespace, "Autotest-eventDef<$ph>" in Name, "event log testing" in Description
    And the user clicks Save button on Definition modal
    Then the user "views" an event definition of "Autotest-eventDef<$ph>" and "event log testing" under "Autotest"
    # Test event log
    When the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "configuration-service:configuration-updated"
    Then the user views the events matching the search filter of "configuration-service:configuration-updated"
    When the user clicks Load more button on event log page
    Then the user views more events matching the search filter of "configuration-service:configuration-updated"
    When the user resets event log views
    And the user searches with "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    Then the user views the events matching the search filter of "now-2mins" as min and "now+2mins" as max timestamps
    When the user resets event log views
    And the user searches with "now-2mins" as minimum timestamp
    Then the user views the events matching the search filter of "now-2mins" as min timestamp
    When the user resets event log views
    And the user searches with "now+2mins" as maximum timestamp
    Then the user views the events matching the search filter of "now+2mins" as maximum timestamp
    When the user resets event log views
    And the user searches with "configuration-service:configuration-updated", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    Then the user views the events matching the search filter of "configuration-service:configuration-updated", and timestamp value between "now-2mins" as min and "now+2mins" as max timestamps
    When the user resets event log views
    Then the user views that search fields are empty
    And the user views that the event log is no longer filtered by "configuration-service:configuration-updated", "now-2mins", "now+2mins"
    # Last the user deletes the event at the end of the test
    When the user selects the "Event" menu item
    And the user selects "Definitions" tab for "Event"
    When the user clicks "Delete" button for the definition of "Autotest-eventDef<$ph>" and "event log testing" under "Autotest"
    Then the user views delete "event definition" confirmation modal for "Autotest-eventDef<$ph>"
    And the user clicks Delete button in delete confirmation modal
    Then the user "should not view" an event definition of "Autotest-eventDef<$ph>" and "event log testing" under "Autotest"

  @TEST_CS-1494 @REQ_CS-1443 @regression
  Scenario: As a tenant admin, I can see service roles registered by services, so that I can see expected services and roles
    Given a tenant admin user is on tenant admin page
    When the user selects the "Access" menu item
    And the user selects "Service roles" tab for "Access"
    Then the user views "autotest-role2", "role 2 for automated test", "No" under "urn:ads:autotest:autotest-service"
    And the user views "file-service-admin", "Administrator role for the file service.", "Yes" under "urn:ads:platform:file-service"

  @TEST_CS-2272 @REQ_CS-1601 @regression
  Scenario: As a tenant admin, I can see support and helpful information about Access service
    Given a tenant admin user is on tenant admin page
    When the user selects the "Access" menu item
    Then the user views the "Access service" overview content "Access allows you to"
    And the user views the link of See the code for "access-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-2501 @REQ_CS-1401 @regression
  Scenario: As a tenant admin, I can see that the tenant admin app does not support mobile view
    Given a tenant admin user is on tenant admin page
    When the user changes the resolution to a low resolution not supported by tenant management app
    Then the user views a message of Portrait mode is currently not supported

  @TEST_CS-2810 @REQ_CS-2740 @regression
  Scenario: As a tenant admin, I can access my tenant login by tenant name, so I can easily access the admin web app
    When the user access tenant management login with the tenant name of "autotest"
    Then the user can access the log in page with the corresponding tenant id showing in the URL
    When the user access tenant management login with the tenant name of "justice-digital"
    Then the user can access the log in page with the corresponding tenant id showing in the URL
    When the user access tenant management login with the tenant name of "nonExistedTenant"
    Then the user is redirected to the tenant management landing page