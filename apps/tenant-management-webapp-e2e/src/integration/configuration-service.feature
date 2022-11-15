@configuration-service
Feature: Configuration-service

  @TEST_CS-1326 @REQ_CS-1120, @regression
  Scenario: As a tenant admin, I can see the Configuration service overview, so I know that it is available
    Given a tenant admin user is on tenant admin page
    When the user selects the "Configuration" menu item
    Then the user views the "Configuration service" overview content "The configuration service provides"
    And the user views the link of API docs for "Configuration service"
    And the user views the link of See the code for "configuration-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-1357 @REQ_CS-1272, @regression
  Scenario: As a tenant admin, I can see the core configuration definitions, so I understand how they are used.
    Given a tenant admin user is on tenant admin page
    When the user selects the "Configuration" menu item
    Then the user views the "Configuration service" overview content "The configuration service provides"
    When the user selects "Definitions" tab for "Configuration"
    Then the user views a heading of "platform" namespace
    And the user views a "file-service" under core-service configurations
    When the user clicks eye icon of "file-service" under Platform to view the schema
    Then the user "views" of the schema for "file-service" and validates "readRoles" in the details
    When the user clicks eye-off icon of "file-service" under Platform to close the schema
    Then the user "should not view" of the schema for "file-service" and validates "readRoles" in the details

  @TEST_CS-1377 @REQ_CS-1126 @REQ_CS-1545 @regression
  Scenario: As a tenant admin, I can add/edit/delete configuration definitions for the configuration service
    Given a tenant admin user is on configuration overview page
    When the user clicks Add definition button on configuration overview page
    Then the user views Add definition modal
    # Invalid data
    When the user enters "platform" in namespace field in configuration definition modal
    Then the user views the error message of "Cannot use the word platform as namespace" on namespace in configuration definition modal
    When the user enters "auto-test-1-$" in namespace field in configuration definition modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -" on namespace in configuration definition modal
    When the user enters "auto-test-1-$" in name field in configuration definition modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -" on name in configuration definition modal
    # Validate data
    When the user enters "autotest" in namespace and "autotest-addEditDeleteConfig" in name, "autotest desc" in description in configuration definition modal
    And the user clicks Save button in configuration definition modal
    Then the user "views" the configuration definition of "autotest-addEditDeleteConfig", "autotest desc" under "autotest"
    # Edit
    When the user clicks "Edit" button for the configuration definition of "autotest-addEditDeleteConfig", "autotest desc" under "autotest"
    Then the user views Edit definition modal
    And the user views disabled namespace and name fields in configuration definition modal
    When the user enters "autotest desc modified" in description in configuration definition modal
    And the user enters "{{}\"test\": \"\"}" in payload schema in configuration definition modal
    And the user clicks Save button in configuration definition modal
    And the user clicks "eye" button for the configuration definition of "autotest-addEditDeleteConfig", "autotest desc modified" under "autotest"
    Then the user views the payload schema containing "\"test\": \"\"" for "autotest-addEditDeleteConfig", "autotest desc modified" under "autotest"
    # Delete
    When the user clicks "Delete" button for the configuration definition of "autotest-addEditDeleteConfig", "autotest desc modified" under "autotest"
    Then the user views delete "configuration definition" confirmation modal for "autotest-addEditDeleteConfig"
    And the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the configuration definition of "autotest-addEditDeleteConfig", "autotest desc modified" under "autotest"

  # TEST DATA: a precreated configuration definition named "autotest-export" under the namespace of "autotest"
  @TEST_CS-1600 @REQ_CS-1544 @REQ_CS-1546 @regression
  Scenario: As a tenant admin, I can see descriptions of configuration in the export, so that I know what export of that configuration includes
    Given a tenant admin user is on configuration export page
    When the user clicks info icon of "autotest", "autotest-export" on configuration export page
    Then the user views the description of "autotest-export desc" for "autotest", "autotest-export" on configuration export page
    When the user clicks info icon of "platform", "pdf-service" on configuration export page
    Then the user views the description of "Templates for PDF generation." for "platform", "pdf-service" on configuration export page

  # TEST DATA: a configuration of autotest:test with revision 1 and 2 is created
  @TEST_CS-997 @REQ_CS-1122 @regression
  Scenario: As a developer, I can set an 'active' alias for a configuration key to a specific revision, so I can activate a specific revision
    When the user sends a request to set active revision to "2" for "test" under "autotest"
    And the user sends a request to set active revision to "1" for "test" under "autotest"
    Then the user gets a response of active revision for "test" under "autotest" being "1"
    Given an admin user is on event log page
    When the user clicks Show details button for the latest event of "active-revision-set" for "configuration-service"
    Then the user views event details of "autotest", "test", "2", "1" of active-revision-set for configuration-service

  @accessibility @regression
  Scenario: As a tenant admin, I can use configuration pages without any critical or serious accessibility issues
    Given a tenant admin user is on configuration overview page
    Then no critical or serious accessibility issues on "configuration overview page"
    When the user selects "Definitions" tab for "Configuration"
    Then no critical or serious accessibility issues on "configuration definitions page"
    # A pending critical issue related to GoA dropdown component
    # When the user selects "Revisions" tab for "Configuration"
    # Then no critical or serious accessibility issues on "configuration revisions page"
    When the user selects "Import" tab for "Configuration"
    Then no critical or serious accessibility issues on "configuration import page"
# CS-1833 pending for fix
# When the user selects "Export" tab for "Configuration"
# Then no critical or serious accessibility issues on "configuration export page"