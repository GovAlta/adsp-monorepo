@form
Feature: Form

  @TEST_CS-2277 @REQ_CS-1847 @regression
  Scenario: As a tenant admin, I can see an overview of the form service, so I understand what it is used for
    Given a tenant admin user is on form service overview page
    Then the user views the "Form service" overview content "The form service provides"
    And the user views the link of API docs for "Form service"
    And the user views the link of See the code for "form-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-2366 @TEST_CS-2356 @TEST_CS-2332 @TEST_CS-2406 @REQ_CS-1848 @REQ_CS-2170 @REQ_CS-2169 @REQ_CS-2254 @regression
  Scenario: As a tenant admin, I can add, edit and delete a form definition
    Given a tenant admin user is on form service overview page
    When the user clicks Add definition button on form service overview page
    Then the user views Add form definition modal
    When the user clicks Cancel button in Add form definition modal
    Then the user views form definitions page
    # Invalid data
    When the user clicks Add definition button on form definitions page
    Then the user views Add form definition modal
    When the user enters "auto-test-1-$", "autotest desc" in Add form definition modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" for Name field in Add form definition modal
    # Validate data
    When the user enters "autotest-formDef", "autotest desc" in Add form definition modal
    And the user clicks Save button in Add form definition modal
    Then the user views form definition editor for "autotest-formDef", "autotest desc"
    When the user clicks roles tab in form definition editor
    And the user enters "auto-test-role1" as applicant roles, "auto-test-role2" as clerk roles, "empty" as assessor roles
    And the user clicks Save button on form definition editor
    And the user clicks Back button on form definition editor
    Then the user "views" the form definition of "autotest-formDef", "autotest desc"
    # Edit and back
    When the user clicks "Edit" button for the form definition of "autotest-formDef", "autotest desc"
    Then the user views form definition editor for "autotest-formDef", "autotest desc"
    When the user clicks roles tab in form definition editor
    And the user enters "auto-test-role2" as applicant roles, "auto-test-role1" as clerk roles, "auto-test-role3" as assessor roles
    And the user clicks Back button on form definition editor
    And the user clicks "Don't save" button on unsaved changes modal
    And the user clicks "Edit" button for the form definition of "autotest-formDef", "autotest desc"
    Then the user views form definition editor for "autotest-formDef", "autotest desc"
    When the user clicks roles tab in form definition editor
    Then the user views "auto-test-role1" as applicant roles, "auto-test-role2" as clerk roles, "empty" as assessor roles in roles tab
    And the user clicks Back button on form definition editor
    # Edit and save
    When the user clicks "Edit" button for the form definition of "autotest-formDef", "autotest desc"
    Then the user views form definition editor for "autotest-formDef", "autotest desc"
    When the user clicks Edit button in form definition editor
    Then the user views Edit definition modal in form definition editor
    When the user enters "autotest-formDef-edited", "autotest desc edited" in Edit definition modal
    And the user clicks Save button in Edit definition modal
    And the user clicks roles tab in form definition editor
    And the user enters "auto-test-role2" as applicant roles, "auto-test-role1" as clerk roles, "auto-test-role3" as assessor roles
    And the user clicks Save button on form definition editor
    And the user clicks Back button on form definition editor
    Then the user "views" the form definition of "autotest-formDef-edited", "autotest desc edited"
    When the user clicks "Edit" button for the form definition of "autotest-formDef-edited", "autotest desc edited"
    And the user clicks roles tab in form definition editor
    Then the user views "auto-test-role2" as applicant roles, "auto-test-role1" as clerk roles, "auto-test-role3" as assessor roles in roles tab
    And the user clicks Back button on form definition editor
    # Delete
    When the user clicks "Delete" button for the form definition of "autotest-formDef-edited", "autotest desc edited"
    Then the user views delete "form definition" confirmation modal for "autotest-formDef"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the form definition of "autotest-formDef-edited", "autotest desc edited"

  #TEST DATA: precreated form definition of "autotest-formDefAccessibility", "DO NOT DELETE", "auto-test-role1", "auto-test-role1", "auto-test-role1"
  @accessibility @regression
  Scenario: As a tenant admin, I can use form pages without any critical or serious accessibility issues
    Given a tenant admin user is on form service overview page
    Then no critical or serious accessibility issues on "form overview page"
    When the user clicks Add definition button on form service overview page
    Then the user views Add form definition modal
    And no critical or serious accessibility issues on "form add form definition modal"
    When the user clicks Cancel button in Add form definition modal
    Then the user views form definitions page
    And no critical or serious accessibility issues on "form definitions page"
## Cypress crashes on accessibility test on form definition editor.
# When the user clicks "Edit" button for the form definition of "autotest-formDefAccessibility", "DO NOT DELETE"
# Then the user views form definition editor for "autotest-formDefAccessibility", "DO NOT DELETE"
# And no critical or serious accessibility issues on "form definition editor page"
