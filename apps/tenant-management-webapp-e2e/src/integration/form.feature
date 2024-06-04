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
    When the user clicks "roles" tab in form definition editor
    And the user enters "auto-test-role1" as applicant roles, "auto-test-role2" as clerk roles, "empty" as assessor roles
    And the user clicks Save button on form definition editor
    And the user clicks Back button on form definition editor
    Then the user "views" the form definition of "autotest-formDef", "autotest desc"
    # Edit and back
    When the user clicks "Edit" button for the form definition of "autotest-formDef", "autotest desc"
    Then the user views form definition editor for "autotest-formDef", "autotest desc"
    When the user clicks "roles" tab in form definition editor
    And the user enters "auto-test-role2" as applicant roles, "auto-test-role1" as clerk roles, "auto-test-role3" as assessor roles
    And the user clicks Back button on form definition editor
    And the user clicks "Don't save" button on unsaved changes modal
    And the user clicks "Edit" button for the form definition of "autotest-formDef", "autotest desc"
    Then the user views form definition editor for "autotest-formDef", "autotest desc"
    When the user clicks "roles" tab in form definition editor
    Then the user views "auto-test-role1" as applicant roles, "auto-test-role2" as clerk roles, "empty" as assessor roles in roles tab
    And the user clicks Back button on form definition editor
    # Edit and save
    When the user clicks "Edit" button for the form definition of "autotest-formDef", "autotest desc"
    Then the user views form definition editor for "autotest-formDef", "autotest desc"
    When the user clicks Edit button in form definition editor
    Then the user views Edit definition modal in form definition editor
    When the user enters "autotest-formDef-edited", "autotest desc edited" in Edit definition modal
    And the user clicks Save button in Edit definition modal
    And the user clicks "roles" tab in form definition editor
    And the user enters "auto-test-role2" as applicant roles, "auto-test-role1" as clerk roles, "auto-test-role3" as assessor roles
    And the user clicks Save button on form definition editor
    And the user clicks Back button on form definition editor
    Then the user "views" the form definition of "autotest-formDef-edited", "autotest desc edited"
    When the user clicks "Edit" button for the form definition of "autotest-formDef-edited", "autotest desc edited"
    And the user clicks "roles" tab in form definition editor
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

  # TEST DATA: a form definition named "autotest-form-submission" is precreated
  @TEST_CS-2717 @REQ_CS-2468 @regression
  Scenario: As a tenant admin, I can configure if a form type creates submission records
    Given a tenant admin user is on form definitions page
    When the user clicks "Edit" button for the form definition of "autotest-form-submission", "DO NOT DELETE"
    Then the user views form definition editor for "autotest-form-submission", "DO NOT DELETE"
    When the user clicks "Submission configuration" tab in form definition editor
    Then the user views a checkbox of "Create submission records on submit"
    When the user "unchecks" the checkbox of Create submission records on submit
    Then the Add state button is invisible on submission configuration page
    When the user clicks the information icon button besides the checkbox of Create submission records on submit
    Then the user "views" the help tooltip for "disabling" create submission records on submit
    When the user clicks x icon for the help tooltip for the checkbox of Create submission records on submit
    Then the user "should not view" the help tooltip for "disabling" create submission records on submit
    When the user "checks" the checkbox of Create submission records on submit
    And the user clicks the information icon button besides the checkbox of Create submission records on submit
    Then the user "views" the help tooltip for "enabling" create submission records on submit
    When the user clicks x icon for the help tooltip for the checkbox of Create submission records on submit
    Then the user "should not view" the help tooltip for "enabling" create submission records on submit

  # TEST DATA: a form definition named "autotest-form-disposition-states" is precreated
  @TEST_CS-3224 @REQ_CS-2468 @regression
  Scenario: As a tenant admin, I can add, order, edit and delete disposition states
    Given a tenant admin user is on form definitions page
    When the user clicks "Edit" button for the form definition of "autotest-form-disposition-states", "DO NOT DELETE"
    Then the user views form definition editor for "autotest-form-disposition-states", "DO NOT DELETE"
    When the user clicks "Submission configuration" tab in form definition editor
    When the user "checks" the checkbox of Create submission records on submit
    # Add disposition states
    When the user clicks the information icon button besides Disposition States
    Then the user "views" the help tooltip text for Disposition States
    When the user clicks x icon for the help tooltip for Disposition States
    Then the user "should not view" the help tooltip text for Disposition States
    When the user adds a dispoistion state of "Approved", "The application is approved"
    Then the user "views" the disposition state of "Approved", "The application is approved"
    When the user adds a dispoistion state of "Documents needed", "Need to supply required documents"
    Then the user "views" the disposition state of "Documents needed", "Need to supply required documents"
    When the user adds a dispoistion state of "Rejected", "The application is rejected"
    Then the user "views" the disposition state of "Rejected", "The application is rejected"
    # Order states
    And the user should only view "arrow down" icon for the disposition state of "Approved", "The application is approved"
    And the user should only view "arrow up" icon for the disposition state of "Rejected", "The application is rejected"
    When the user clicks "arrow up" for the disposition state of "Documents needed", "Need to supply required documents"
    Then the user views the disposition state of "Documents needed", "Need to supply required documents" being row "1"
    When the user clicks "arrow down" for the disposition state of "Approved", "The application is approved"
    Then the user views the disposition state of "Approved", "The application is approved" being row "3"
    # Edit states
    When the user clicks Save button on form definition editor
    And the user clicks Back button on form definition editor
    And the user clicks "Edit" button for the form definition of "autotest-form-disposition-states", "DO NOT DELETE"
    When the user clicks "Submission configuration" tab in form definition editor
    When the user clicks "edit" button for the disposition state of "Approved", "The application is approved"
    Then the user views Edit disposition state modal
    When the user enters "Reviewed" as name and "The application is reviewed" as description in Edit disposition state modal
    And the user clicks Cancel button in Edit disposition state modal
    Then the user "should not view" the disposition state of "Reviewed", "The application is reviewed"
    When the user clicks "edit" button for the disposition state of "Approved", "The application is approved"
    Then the user views Edit disposition state modal
    When the user enters "Reviewed" as name and "The application is reviewed" as description in Edit disposition state modal
    And the user clicks Save button in disposition state modal
    Then the user "views" the disposition state of "Reviewed", "The application is reviewed"
    # # Delete states
    When the user clicks Save button on form definition editor
    And the user clicks Back button on form definition editor
    And the user clicks "Edit" button for the form definition of "autotest-form-disposition-states", "DO NOT DELETE"
    When the user clicks "Submission configuration" tab in form definition editor
    When the user clicks "Delete" button for the disposition state of "Reviewed", "The application is reviewed"
    Then the user views delete "disposition state" confirmation modal for "Reviewed"
    When the user clicks Cancel button in delete confirmation modal
    Then the user "views" the disposition state of "Reviewed", "The application is reviewed"
    When the user clicks "Delete" button for the disposition state of "Reviewed", "The application is reviewed"
    Then the user views delete "disposition state" confirmation modal for "Reviewed"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the disposition state of "Reviewed", "The application is reviewed"
    When the user clicks "Delete" button for the disposition state of "Documents needed", "Need to supply required documents"
    Then the user views delete "disposition state" confirmation modal for "Documents needed"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the disposition state of "Documents needed", "Need to supply required documents"
    When the user clicks "Delete" button for the disposition state of "Rejected", "The application is rejected"
    Then the user views delete "disposition state" confirmation modal for "Rejected"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the disposition state of "Rejected", "The application is rejected"
    When the user clicks Save button on form definition editor
    And the user clicks Back button on form definition editor
    And the user clicks "Edit" button for the form definition of "autotest-form-disposition-states", "DO NOT DELETE"
    When the user clicks "Submission configuration" tab in form definition editor
    Then the user "should not view" the disposition state of "Reviewed", "The application is reviewed"
    Then the user "should not view" the disposition state of "Documents needed", "Need to supply required documents"
    Then the user "should not view" the disposition state of "Rejected", "The application is rejected"
