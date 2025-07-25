@form
Feature: Form

  @TEST_CS-2277 @REQ_CS-1847 @regression
  Scenario: As a tenant admin, I can see an overview of the form service, so I understand what it is used for
    Given a tenant admin user is on form service overview page
    Then the user views the "Form service" overview content "The form service provides"
    And the user views the link of API docs for "Form service"
    And the user views the link of See the code for "form-service"
    And the user views the link of "Get support" under Support

  # TEST DATA: a form definition named "autotest-submission-task" is precreated
  # TEST DATA: a task queue named autotest:testSubmissionQueue is precreated
  @TEST_CS-2780 @REQ_CS-2570 @regression
  Scenario: As a tenant admin, I can configure if and what task is created for processing a form submission record
    Given all existing tasks in "testSubmissionQueue" if any have been deleted
    And a tenant admin user is on form definitions page
    When the user clicks "Edit" button for the form definition of "autotest-submission-task", "DO NOT DELETE"
    Then the user views form definition editor for "autotest-submission-task", "DO NOT DELETE"
    When the user clicks "Lifecycle" tab in form definition editor
    # Verify help content for No task created option
    And the user "checks" the checkbox of Create submission records on submit
    And the user selects "No task created" in task queue to process dropdown
    And the user clicks the information icon button besides task queue to process dropdown
    Then the user "views" the help tooltip for "disabling" task queue to process dropdown
    # Select a task and verify help content for a task queue is selected
    When the user selects "autotest:testSubmissionQueue" in task queue to process dropdown
    And the user clicks the information icon button besides task queue to process dropdown
    Then the user "views" the help tooltip for "enabling" task queue to process dropdown
    When the user saves the changes if any and go back out of form definition editor
    # Submit a form
    Given the user deletes any existing form from "Auto Test" for "autotest-submission-task"
    When the user is logged in to see "autotest-submission-task" application
    Then the user views a from draft of "autotest-submission-task"
    When the user enters "Joe" in a text field labelled "First name"
    And the user clicks submit button in the form
    Then the user views a callout with a message of "We're processing your application"
    # Verify a task is created for form submission
    Given a tenant admin user is on task service overview page
    When the user selects "Tasks" tab for "Task"
    And the user selects "autotest:testSubmissionQueue" in Select a queue dropdown
    Then the user "views" the task of "Process form submission", "autotest-submission-task" on tasks page
    # Set task queue to No task created for the form
    When the user selects the "Form" menu item
    And the user selects "Definitions" tab for "Form"
    And the user clicks "Edit" button for the form definition of "autotest-submission-task", "DO NOT DELETE"
    Then the user views form definition editor for "autotest-submission-task", "DO NOT DELETE"
    When the user clicks "Lifecycle" tab in form definition editor
    And the user selects "No task created" in task queue to process dropdown
    And the user clicks Save button in form definition editor
    And the user clicks Back button in form definition editor

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
    When the user enters "autotest-formDef<$ph>", "autotest desc" in Add form definition modal
    And the user clicks Save button in Add form definition modal
    Then the user views form definition editor for "autotest-formDef<$ph>", "autotest desc"
    When the user clicks "Roles" tab in form definition editor
    And the user enters "auto-test-role1" as applicant roles, "auto-test-role2" as clerk roles, "empty" as assessor roles
    And the user clicks Save button in form definition editor
    And the user clicks Back button in form definition editor
    Then the user "views" the form definition of "autotest-formDef<$ph>", "autotest desc"
    # Edit and back
    When the user clicks "Edit" button for the form definition of "autotest-formDef<$ph>", "autotest desc"
    Then the user views form definition editor for "autotest-formDef<$ph>", "autotest desc"
    When the user clicks "Roles" tab in form definition editor
    And the user enters "auto-test-role2" as applicant roles, "auto-test-role1" as clerk roles, "auto-test-role3" as assessor roles
    And the user clicks Back button in form definition editor
    And the user clicks "Don't save" button on unsaved changes modal
    And the user clicks "Edit" button for the form definition of "autotest-formDef<$ph>", "autotest desc"
    Then the user views form definition editor for "autotest-formDef<$ph>", "autotest desc"
    When the user clicks "Roles" tab in form definition editor
    Then the user views "auto-test-role1" as applicant roles, "auto-test-role2" as clerk roles, "empty" as assessor roles in roles tab
    And the user clicks Back button in form definition editor
    # Edit and save
    When the user clicks "Edit" button for the form definition of "autotest-formDef<$ph>", "autotest desc"
    Then the user views form definition editor for "autotest-formDef<$ph>", "autotest desc"
    When the user clicks Edit button in form definition editor
    Then the user views Edit definition modal in form definition editor
    When the user enters "autotest-formDef<$ph>-new", "autotest desc edited" in Edit definition modal
    And the user clicks Save button in Edit definition modal
    And the user clicks "Roles" tab in form definition editor
    And the user enters "auto-test-role2" as applicant roles, "auto-test-role1" as clerk roles, "auto-test-role3" as assessor roles
    And the user clicks Save button in form definition editor
    And the user clicks Back button in form definition editor
    Then the user "views" the form definition of "autotest-formDef<$ph>-new", "autotest desc edited"
    When the user clicks "Edit" button for the form definition of "autotest-formDef<$ph>-new", "autotest desc edited"
    And the user clicks "Roles" tab in form definition editor
    Then the user views "auto-test-role2" as applicant roles, "auto-test-role1" as clerk roles, "auto-test-role3" as assessor roles in roles tab
    And the user clicks Back button in form definition editor
    # Delete
    When the user clicks "Delete" button for the form definition of "autotest-formDef<$ph>-new", "autotest desc edited"
    Then the user views delete form definition confirmation modal for "autotest-formDef<$ph>"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the form definition of "autotest-formDef<$ph>-new", "autotest desc edited"

  # Ignore the test for now as the copy link icon has accessibility issue
  #TEST DATA: precreated form definition of "autotest-formDefAccessibility", "DO NOT DELETE", "auto-test-role1", "auto-test-role1", "auto-test-role1"
  @accessibility @regression @ignore
  Scenario: As a tenant admin, I can use form pages without any critical or serious accessibility issues
    Given a tenant admin user is on form service overview page
    Then no critical or serious accessibility issues on "form overview page"
    When the user clicks Add definition button on form service overview page
    Then the user views Add form definition modal
    And no critical or serious accessibility issues on "form add form definition modal"
    When the user clicks Cancel button in Add form definition modal
    Then the user views form definitions page
    And no critical or serious accessibility issues on "form definitions page"
  ## Cypress crashes on accessibility test in form definition editor.
  # When the user clicks "Edit" button for the form definition of "autotest-formDefAccessibility", "DO NOT DELETE"
  # Then the user views form definition editor for "autotest-formDefAccessibility", "DO NOT DELETE"
  # And no critical or serious accessibility issues on "form definition editor page"

  # TEST DATA: a form definition named "autotest-form-submission" is precreated
  @TEST_CS-2717 @REQ_CS-2468 @regression
  Scenario: As a tenant admin, I can configure if a form type creates submission records
    Given a tenant admin user is on form definitions page
    When the user clicks "Edit" button for the form definition of "autotest-form-submission", "DO NOT DELETE"
    Then the user views form definition editor for "autotest-form-submission", "DO NOT DELETE"
    When the user clicks "Lifecycle" tab in form definition editor
    Then the user views a checkbox of "Create submission records on submit"
    When the user "unchecks" the checkbox of Create submission records on submit
    Then the Add state button is invisible on Lifecycle page
    When the user clicks the information icon button besides the checkbox of Create submission records on submit
    Then the user "views" the help tooltip for "disabling" create submission records on submit
    When the user "checks" the checkbox of Create submission records on submit
    And the user clicks the information icon button besides the checkbox of Create submission records on submit
    Then the user "views" the help tooltip for "enabling" create submission records on submit

  # TEST DATA: a form definition named "autotest-form-disposition-states" is precreated
  @TEST_CS-3224 @REQ_CS-2468 @regression
  Scenario: As a tenant admin, I can add, order, edit and delete disposition states
    Given a tenant admin user is on form definitions page
    When the user clicks "Edit" button for the form definition of "autotest-form-disposition-states", "DO NOT DELETE"
    Then the user views form definition editor for "autotest-form-disposition-states", "DO NOT DELETE"
    When the user clicks "Lifecycle" tab in form definition editor
    And the user deletes all disposition states if any
    And the user "checks" the checkbox of Create submission records on submit
    # Add disposition states
    And the user clicks the information icon button besides Disposition States
    Then the user "views" the help tooltip text for Disposition States
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
    When the user clicks Save button in form definition editor
    And the user clicks Back button in form definition editor
    And the user clicks "Edit" button for the form definition of "autotest-form-disposition-states", "DO NOT DELETE"
    When the user clicks "Lifecycle" tab in form definition editor
    And the user clicks "edit" button for the disposition state of "Approved", "The application is approved"
    Then the user views Edit disposition state modal
    When the user enters "Reviewed" as name and "The application is reviewed" as description in Edit disposition state modal
    And the user clicks Cancel button in Edit disposition state modal
    Then the user "should not view" the disposition state of "Reviewed", "The application is reviewed"
    When the user clicks "edit" button for the disposition state of "Approved", "The application is approved"
    Then the user views Edit disposition state modal
    When the user enters "Reviewed" as name and "The application is reviewed" as description in Edit disposition state modal
    And the user clicks Save button in disposition state modal
    Then the user "views" the disposition state of "Reviewed", "The application is reviewed"
    # Delete states
    When the user clicks Save button in form definition editor
    And the user clicks Back button in form definition editor
    And the user clicks "Edit" button for the form definition of "autotest-form-disposition-states", "DO NOT DELETE"
    When the user clicks "Lifecycle" tab in form definition editor
    And the user clicks "Delete" button for the disposition state of "Reviewed", "The application is reviewed"
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
    When the user clicks Save button in form definition editor
    And the user clicks Back button in form definition editor
    And the user clicks "Edit" button for the form definition of "autotest-form-disposition-states", "DO NOT DELETE"
    And the user clicks "Lifecycle" tab in form definition editor
    Then the user "should not view" the disposition state of "Reviewed", "The application is reviewed"
    And the user "should not view" the disposition state of "Documents needed", "Need to supply required documents"
    And the user "should not view" the disposition state of "Rejected", "The application is rejected"

  @TEST_CS-3356 @REQ_CS-3381 @regression
  Scenario: As a tenant admin, I can set the classification on a form definition and view the updated classification in event log
    Given a tenant admin user is on form definitions page
    # Add a form definition
    When the user clicks Add definition button on form definitions page
    Then the user views Add form definition modal
    When the user enters "autotest-sec-cls<$ph>", "autotest desc" in Add form definition modal
    And the user clicks Save button in Add form definition modal
    # Lifecycle page validation for security classification
    Then the user views form definition editor for "autotest-sec-cls<$ph>", "autotest desc"
    When the user clicks "Lifecycle" tab in form definition editor
    Then the user views Security classification dropdown after Form template URL under Application
    And the user views the security classification dropdown has the default value of "Protected B" from the options of "Public", "Protected A", "Protected B", "Protected C"
    When the user selects "Protected C" from the security classification dropdown in form definition editor
    And the user clicks Save button in form definition editor
    And the user clicks Back button in form definition editor
    And the user clicks "Edit" button for the form definition of "autotest-sec-cls<$ph>", "autotest desc"
    And the user clicks "Lifecycle" tab in form definition editor
    Then the user views "Protected C" in security classification dropdown in form definition editor
    When the user clicks Back button in form definition editor
    # Configuration updated event log validation for security classification
    And the user waits "10" seconds
    And the user selects the "Event log" menu item
    And the user searches with "configuration-service:configuration-updated", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    And the user clicks Show details button for the latest event of "configuration-updated" for "configuration-service"
    Then the user views the event details for the configuration-updated event to have "Protected C" as the securityClassification value
    # Delete the created form definition
    When the user selects the "Form" menu item
    And the user selects "Definitions" tab for "Form"
    And the user clicks "Delete" button for the form definition of "autotest-sec-cls<$ph>", "autotest desc"
    Then the user views delete form definition confirmation modal for "autotest-sec-cls<$ph>"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the form definition of "autotest-sec-cls<$ph>", "autotest desc"

  @TEST_CS-3358 @REQ_CS-3306 @regression
  Scenario: As a tenant admin, I can see form-applicant as default applicant role for new form definitions
    Given a tenant admin user is on form definitions page
    # Add a form definition
    When the user clicks Add definition button on form definitions page
    Then the user views Add form definition modal
    When the user enters "autotest-defaultApplicantRole", "autotest desc" in Add form definition modal
    And the user clicks Save button in Add form definition modal
    # Validate default applicant role is selected
    Then the user views form definition editor for "autotest-defaultApplicantRole", "autotest desc"
    When the user clicks "Roles" tab in form definition editor
    Then the user views "form-applicant" as applicant role under "urn:ads:platform:form-service" is "checked"
    # Delete the form definition
    When the user clicks Back button in form definition editor
    And the user clicks "Delete" button for the form definition of "autotest-defaultApplicantRole", "autotest desc"
    Then the user views delete "form definition" confirmation modal for "autotest-defaultApplicantRole"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the form definition of "autotest-defaultApplicantRole", "autotest desc"

  @TEST_CS-2702 @REQ_CS-2679 @regression
  Scenario: As a tenant admin, I can see the form output data in the form preview
    Given a tenant admin user is on form definitions page
    When the user clicks "Edit" button for the form definition of "autotest-preview-data", "DO NOT DELETE"
    Then the user views form definition editor for "autotest-preview-data", "DO NOT DELETE"
    # Enter form data
    When the user enters "Joe" in a text field labelled "First name" in preview pane
    And the user enters "Smith" in a text field labelled "Last name" in preview pane
    And the user enters "1970-10-30" in a date picker labelled "Birthday" in preview pane
    And the user enters "CA" in a dropdown labelled "Nationality" in preview pane
    And the user clicks Next button in the form in preview pane
    And the user "selects" a checkbox labelled "Citizen" in preview pane
    And the user selects "Not Married" radio button for the question of "Are you married?" in preview pane
    And the user clicks list with detail button labelled as "Add child" in the form in preview pane
    And the user enters "John" in list with detail element text field labelled "Given name" in preview pane
    And the user enters "Smith" in list with detail element text field labelled "Surname" in preview pane
    And the user enters "2010-01-15" in list with detail element date input labelled "Dob" in preview pane
    # Verify form data
    When the user clicks "Data" tab in form definition editor
    Then the user views form data pane
    And the user views form data of "Joe" as "firstName" on data page
    And the user views form data of "Smith" as "lastName" on data page
    And the user views form data of "1970-10-30" as "birthDate" on data page
    And the user views form data of "CA" as "nationality" on data page
    And the user views form data of "false" as "isMarried" on data page
    And the user views form data of "true" as "citizen" for "residencyOptions" object on data page
    And the user views form data of "John:Smith:2010-01-15" as "givenName:surname:dob" for "dependant" array on data page
    # Modify form data
    When the user clicks "Preview" tab in form definition editor
    Then the user views form definition Preview pane
    When the user enters "James" in a text field labelled "First name" in preview pane
    And the user enters "Bond" in a text field labelled "Last name" in preview pane
    And the user enters "1960-11-20" in a date picker labelled "Birthday" in preview pane
    And the user enters "Other" in a dropdown labelled "Nationality" in preview pane
    And the user clicks Next button in the form in preview pane
    And the user "unselects" a checkbox labelled "Citizen" in preview pane
    And the user selects "Married" radio button for the question of "Are you married?" in preview pane
    # And the user clicks list with detail button labelled as "Add child" in the form in preview pane
    And the user enters "Ben" in list with detail element text field labelled "Given name" in preview pane
    And the user enters "Bond" in list with detail element text field labelled "Surname" in preview pane
    And the user enters "2011-05-15" in list with detail element date input labelled "Dob" in preview pane
    # Verify modified form data
    When the user clicks "Data" tab in form definition editor
    Then the user views form data of "James" as "firstName" on data page
    And the user views form data of "Bond" as "lastName" on data page
    And the user views form data of "1960-11-20" as "birthDate" on data page
    And the user views form data of "Other" as "nationality" on data page
    And the user views form data of "true" as "isMarried" on data page
    And the user views form data of "false" as "citizen" for "residencyOptions" object on data page
    And the user views form data of "Ben:Bond:2011-05-15" as "givenName:surname:dob" for "dependant" array on data page

  # TEST DATA: a form definition named "autotest-form-tags" is precreated; all tags in the form definition are deleted
  @TEST_CS-3927 @REQ_CS-3589 @TEST_CS-3943 @REQ_CS-3591 @regression
  Scenario: As a tenant admin, I can add, edit and delete tags for a form definition and view them in details view
    Given a tenant admin user is on form definitions page
    When the user deletes all tags for the form definition of "autotest-form-tags", "DO NOT DELETE"
    # Add a new tag
    And the user clicks "Add tag" button for the form definition of "autotest-form-tags", "DO NOT DELETE"
    Then the user views Add tags modal for "autotest-form-tags"
    When the user enters "mytag$$$" in the tag input field in Add tags modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" in Add tags modal
    When the user enters "   mytag<$ph>   " in the tag input field in Add tags modal
    And the user clicks "Create and add tag" button in Add tags modal
    And the user clicks "Add tag" button for the form definition of "autotest-form-tags", "DO NOT DELETE"
    Then the user views the tag "mytag<$ph>" under the tag input field in Add tags modal
    # Enter an existing tag
    When the user enters "autotest" in the tag input field in Add tags modal
    And the user clicks "Add tag" button in Add tags modal
    And the user clicks "Add tag" button for the form definition of "autotest-form-tags", "DO NOT DELETE"
    Then the user views the tag "autotest" under the tag input field in Add tags modal
    # Enter a duplicate tag
    When the user enters "autotest" in the tag input field in Add tags modal
    Then the user views Add tag button being disabled in Add tags modal
    When the user clicks "Close" button in Add tags modal
    Then the user "should not view" the Add tags modal
    # View tags in details view
    When the user clicks "Eye" button for the form definition of "autotest-form-tags", "DO NOT DELETE"
    Then the user views "autotest-form-tags" as Definition ID and "autotest,mytag<$ph>" as Tags in the details view
    When the user clicks "Eye off" button for the form definition of "autotest-form-tags", "DO NOT DELETE"
    Then the user should not view details view of "autotest-form-tags", "DO NOT DELETE" on form definitions page
    # Remove a tag
    When the user clicks "Add tag" button for the form definition of "autotest-form-tags", "DO NOT DELETE"
    Then the user views Add tags modal for "autotest-form-tags"
    When the user clicks Remove button for the tag "mytag<$ph>" in Add tags modal
    Then the user "should not view" the tag "mytag<$ph>" under the tag input field in Add tags modal
    When the user clicks Remove button for the tag "autotest" in Add tags modal
    Then the user "should not view" the tag "autotest" under the tag input field in Add tags modal
    When the user clicks "Close" button in Add tags modal
    And the user clicks "Eye" button for the form definition of "autotest-form-tags", "DO NOT DELETE"
    Then the user should not view "mytag<$ph>" tag in the details view on form definitions page
    And the user should not view "autotest" tag in the details view on form definitions page