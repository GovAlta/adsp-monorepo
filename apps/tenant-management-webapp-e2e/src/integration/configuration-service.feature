@configuration-service
Feature: Configuration-service

  @TEST_CS-1326 @REQ_CS-1120 @regression
  Scenario: As a tenant admin, I can see the Configuration service overview, so I know that it is available
    Given a tenant admin user is on tenant admin page
    When the user selects the "Configuration" menu item
    Then the user views the "Configuration service" overview content "The configuration service provides"
    And the user views the link of API docs for "Configuration service"
    And the user views the link of See the code for "configuration-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-1357 @REQ_CS-1272 @regression
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

  # CS-4381: Edit configuration changes from modal to editor. This test needs to be modified or a new test to be created for this.
  @TEST_CS-1377 @REQ_CS-1126 @REQ_CS-1545 @regression @ignore
  Scenario: As a tenant admin, I can add/edit/delete configuration definitions for the configuration service
    Given a tenant admin user is on configuration overview page
    When the user clicks Add definition button on configuration overview page
    Then the user views Add configuration definition modal
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
    ## Monaco editor doesn't work constantly with Cypress and modifying payload schema doesn't happen from time to time causing the test to fail.
    ## Commented the change of payload schema from the test for now.
    # And the user enters "{\"test\": \"\"}" in payload schema in configuration definition modal
    And the user clicks Save button in configuration definition modal
    # And the user clicks "eye" button for the configuration definition of "autotest-addEditDeleteConfig", "autotest desc modified" under "autotest"
    # Then the user views the payload schema containing "\"test\": \"\"" for "autotest-addEditDeleteConfig", "autotest desc modified" under "autotest"
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
    When the user waits "5" seconds
    Given an admin user is on event log page
    When the user searches with "configuration-service:active-revision-set", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    And the user clicks Show details button for the latest event of "active-revision-set" for "configuration-service"
    Then the user views event details of "autotest", "test", "2", "1" of active-revision-set for configuration-service

  @accessibility @regression
  Scenario: As a tenant admin, I can use configuration pages without any critical or serious accessibility issues
    Given a tenant admin user is on configuration overview page
    Then no critical or serious accessibility issues on "configuration overview page"
    When the user clicks Add definition button on configuration overview page
    Then the user views Add configuration definition modal
    #And no critical or serious accessibility issues for "configuration definition modal" on "configuration definitions page"
    When the user clicks Cancel button in configuration definition modal
    #Then no critical or serious accessibility issues on "configuration definitions page"
    # A pending critical issue related to GoA dropdown component
    # When the user selects "Revisions" tab for "Configuration"
    # Then no critical or serious accessibility issues on "configuration revisions page"
    When the user selects "Import" tab for "Configuration"
    Then no critical or serious accessibility issues on "configuration import page"
  # CS-1833 pending for fix
  # When the user selects "Export" tab for "Configuration"
  # Then no critical or serious accessibility issues on "configuration export page"

  # CS-4381: revisions tab has been moved to configuration editor. This test needs to be modified or a new test to be created for this.
  # TEST DATA: autotest:test configuration with some existing revisions
  @TEST_CS-1871 @REQ_CS-1797 @TEST_CS-2231 @REQ_CS-1792 @TEST_2226 @REQ_CS-1791 @TEST_CS-1414 @REQ_CS-1790 @regression @ignore
  Scenario: As a tenant admin, I can create, edit, view and set configuration revision
    Given a tenant admin user is on configuration revisions page
    # Create a new revision and view the new revision
    When the user selects "autotest:test" from select definition dropdown
    Then the user views a list of configuration revisions with a latest revision
    When the user clicks add revision icon of the latest revision
    Then the user views the revision creation confirmation modal for "autotest:test"
    When the user clicks Create button in the revision creation confirmation modal
    Then the user views a new revision is created with the current timestamp
    And the user views the details of the latest revision and the second last revision are the same
    # Edit the latest revision
    When the user clicks "edit" icon for the latest revision
    Then the user views Edit revision modal for "autotest:test"
    And the user views "{\"autotest-*\": {\"id\": \"autotest-*\", \"name\": \"autotest-*\", \"description\": \"test\"}}" in payload schema in configuration definition modal
    When the user enters "{\"test\"}" in payload schema in configuration definition modal
    Then the user views the error message of "Please provide a valid json configuration"
    And the save button in Edit revision modal is disabled
    When the user enters "{\"autotest-*\": {\"id\": \"autotest-*\", \"name\": \"autotest-*\", \"description\": \"test\"}}" in payload schema in configuration definition modal
    And the user clicks Save button in Edit revision modal
    And the user clicks "eye" icon for the latest revision
    And the user views "{\"autotest-*\": {\"id\": \"autotest-*\", \"name\": \"autotest-*\", \"description\": \"test\"}}" for the latest revision
    # Set a new active revision
    When the user clicks power icon on the second last revision
    Then the user views set active revision confirmation modal for the second last revision of "autotest:test"
    When the user click Set Active button in set active revision confirmation modal
    Then the user views the active label on the second last revision
    And the user should not view power icon on the active revision
    # Load more
    When the user clicks Load more button on configuration service revisions page
    Then the user views more than ten revision records

  @TEST_CS-3439 @REQ_CS-3381 @regression
  Scenario: As a tenant admin, I can validate the configuration schema for form service to have securityClassification property
    Given a tenant admin user is on configuration definitions page
    When the user clicks "eye" button for the configuration definition of "form-service", "Definitions of forms with configuration of roles allowed to submit and assess." under "form-service"
    Then the user views "form-service" configuration schema to include property for the securityClassification