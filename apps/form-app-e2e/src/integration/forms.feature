Feature: Form app

  @smoke-test
  Scenario: As a grant applicant, I can submit an application
    When a user goes to form app overview site
    Then the user views the overview page of form app

  @accessibility @regression
  Scenario: As a user, I can see the form app overview page without any critical and serious accessibility issues
    When a user goes to form app overview site
    Then no critical or serious accessibility issues on "form app overview" page

  @TEST_CS-3110 @TEST_CS-3459 @REQ_CS-2909 @regression @prod
  Scenario: As an authenticated user, I can log in to submit an application
    Given the user deletes any existing form from "Auto Test" for "autotest-testformapp"
    When an authenticated user is logged in to see "autotest-testformapp" application
    Then the user views a form draft of "autotest-testformapp"
    When the user enters "Auto" in a text field labelled "First name"
    And the user enters "Test" in a text field labelled "Last name"
    And the user enters "1970-10-30" in a date picker labelled "Birthday"
    And the user enters "CA" in a dropdown labelled "Nationality"
    And the user clicks Next button in the form
    And the user selects "Not Married" radio button for the question of "Are you married?"
    # Using both radio button and checkbox causing the review page validation fail randomly. Remove checkbox user input for now.
    # And the user "selects" a checkbox labelled "Citizen"
    And the user clicks list with detail button labelled as "Add child" in the form
    And the user enters "John" in list with detail element text field labelled "First name"
    And the user enters "Smith" in list with detail element text field labelled "Last name"
    And the user enters "2010-01-15" in list with detail element date input labelled "Dob"
    And the user clicks Continue button for the list with detail in the form
    And the user clicks Next button in the form
    Then the user views the summary of "Personal Information" with "Auto" as "required" "First name"
    And the user views the summary of "Personal Information" with "Test" as "required" "Last name"
    And the user views the summary of "Personal Information" with "1970-10-30" as "not required" "Birthday"
    And the user views the summary of "Additional Information" with "No" as "required" "Are you married?"
    # And the user views the summary of "Additional Information" with "Yes" as "not required" "Citizen"
    And the user views the summary of "Additional Information" with "John:Smith:2010-01-15" as a "Dependant"
    When the user clicks submit button in the form
    Then the user views a callout with a message of "We're processing your application"
    When the user clicks Download PDF copy link on form submission confirmation page
    Then the user views the PDF copy of "autotest-testformapp.pdf" being downloaded
    When the user sends a delete form request
    Then the new form is deleted

  # Anonymous submission is pretected by reCAPTCHA and Cypress test will fail to pass CAPTCHA validation
  # TEST DATA: autotest-anonymous-submission is created as a form definition with anonymous enabled
  @TEST_CS-3570 @REQ_CS-3484 @REQ_CS-3485 @regression @ignore
  Scenario: As an anonymous applicant, I can view and submit an anonymous application
    Given an anonymous applicant goes to "autotest-anonymous-submission" application
    Then the user views an anonymous form draft of "autotest-anonymous-submission"
    When the user enters "Joe" in a text field labelled "First Name"
    And the user enters "Smith" in a text field labelled "Last Name"
    And the user enters "1970-10-30" in a date picker labelled "Birthday"
    And the user enters "CA" in a dropdown labelled "Nationality"
    And the user clicks Next button in the form
    And the user selects "Not Married" radio button for the question of "Are you married?"
    And the user clicks list with detail button labelled as "Add child" in the form
    And the user enters "John" in list with detail element text field labelled "First Name"
    And the user enters "Smith" in list with detail element text field labelled "Last Name"
    And the user enters "2010-01-15" in list with detail element date input labelled "Dob"
    And the user clicks Next button in the form
    And the user clicks submit button in the form
    Then the user views a callout with a message of "We're processing your application"

  # TEST DATA: autotest-anonymous-submission is created as a form definition with anonymous enabled
  @TEST_CS-3571 @REQ_CS-3484 @REQ_CS-3485 @regression @prod
  Scenario: As an anonymous applicant, I can see validation errors on missing required fields and cannot submit the form without all required fields being set
    Given an anonymous applicant goes to "autotest-anonymous-submission" application
    Then the user views an anonymous form draft of "autotest-anonymous-submission"
    When the user enters "Joe" in a text field labelled "First name"
    # And the user enters "1970-10-30" in a date picker labelled "Birthday"
    And the user enters "CA" in a dropdown labelled "Nationality"
    And the user clicks Next button in the form
    And the user clicks list with detail button labelled as "Add child" in the form
    And the user enters "John" in list with detail element text field labelled "First name"
    And the user enters "Smith" in list with detail element text field labelled "Last name"
    # And the user enters "2010-01-15" in list with detail element date input labelled "Dob"
    And the user clicks Next button in the form
    Then the user views "Last name is required" validation error message under "Last name" field of "Personal Information" on summary page
    And the user views "Are you married? is required" validation error message under "Are you married?" field of "Additional Information" on summary page
    And the user views the submit button is disabled on summary page

  # TEST DATA: autotest-open-intake is created as a form definition with an open intake period
  @TEST_CS-4319 @REQ_CS-2954 @regression
  Scenario: As a form applicant, I can apply during an open intake period
    Given the user deletes any existing form from "Auto Test" for "autotest-open-intake"
    When an authenticated user is logged in to see "autotest-open-intake" application
    Then the user views a drafted form for "autotest-open-intake"


  # TEST DATA: autotest-closed-intake is created as a form definition with an open intake period in the past
  @TEST_CS-4567 @REQ_CS-2954 @regression
  Scenario: As a form applicant, I cannot apply outside open intake period(s)
    When an authenticated user is logged in to see "autotest-closed-intake" application
    Then the user views a callout message of "This form is not available at this time"

  # TEST DATA: autotest-closed-submitted is created as a form definition with an open intake period in the past and an application already submitted by the test user
  @TEST_CS-4568 @REQ_CS-2954 @regression
  Scenario: As a form applicant, I cannot apply outside an open intake period
    When an authenticated user is logged in to see "autotest-closed-submitted" application
    Then the user views a success callout message of "We're processing your application"

  # TEST DATA: autotest-form-tester-role is created as a form definition with an open intake period in the future
  # TEST DATA: autotest user 3 <email3>/<password3> is assigned with "form-tester" role which has access to see the form definition outside intake period
  @TEST_CS-4314 @REQ_CS-2955 @regression
  Scenario: As a form tester, I can access and use forms not yet opened for submissions
    When autotest user 3 is logged in to see "autotest-form-tester-role" application
    Then the user views a form page with primary application button enabled for "autotest-form-tester-role"

  # TEST DATA: autotest-tasklist is created as a form definition with two tasks and a summary page
  @TEST_CS-4052 @REQ_CS-3812 @REQ_CS-4016 @REQ_CS-3881 @REQ_CS-4015 @REQ_CS-4168 @regression
  Scenario: As a form user, I can navigate between the task list and pages, view task status, submit it from summary page
    Given the user deletes any existing form from "Auto Test" for "autotest-tasklist"
    When an authenticated user is logged in to see "autotest-tasklist" application
    Then the user views a form draft of "autotest-tasklist"
    And the user views "Automated Test Application" as the form title
    And the user views Application Progress with "0 out of 2 items completed" progress status
    And the user views section title of "1. Personal Data" on task list page
    And the user views section title of "2. More Information" on task list page
    And the user views the task of "Personal Information" with "Not started" status
    And the user views the task of "Additional Information" with "Not started" status
    And the user views Summary link as the last link in the table on task list page
    When the user clicks "Personal Information" task on task list page
    Then the user views Step "1" of "2" on the form page
    When the user enters "Auto" in a text field labelled "First name"
    And the user enters "Test" in a text field labelled "Last name"
    And the user enters "1970-10-30" in a date picker labelled "Birthday"
    And the user enters "CA" in a dropdown labelled "Nationality"
    And the user clicks Next button on a tasklist step page
    Then the user views Step "2" of "2" on the form page
    When the user clicks Back to application overview link on the form page
    Then the user views the task of "Personal Information" with "Completed" status
    And the user views the task of "Additional Information" with "In progress" status
    When the user clicks "Additional Information" task on task list page
    And the user selects "Not Married" radio button for the question of "Are you married?"
    And the user clicks list with detail button labelled as "Add child" in the form
    And the user enters "John" in list with detail element text field labelled "First name"
    And the user enters "Smith" in list with detail element text field labelled "Last name"
    And the user enters "2010-01-15" in list with detail element date input labelled "Dob"
    And the user clicks Next button on a tasklist step page
    Then the user views the summary of "Personal Information" with "Auto" as "required" "First name"
    And the user views the summary of "Personal Information" with "Test" as "required" "Last name"
    And the user views the summary of "Personal Information" with "1970-10-30" as "not required" "Birthday"
    And the user views the summary of "Additional Information" with "No" as "required" "Are you married?"
    And the user views the summary of "Additional Information" with "John:Smith:2010-01-15" as a "Dependant"
    When the user clicks submit button in the form
    Then the user views a callout with a message of "We're processing your application"
    When the user sends a delete form request
    Then the new form is deleted

  # TEST DATA: regression-control-examples is created with all types of control examples with some validation rules
  @TEST_CS-4007 @regression
  Scenario: As a form user, I can see validation errors on different rules
    Given an anonymous applicant goes to "regression-control-examples" application
    Then the user views an anonymous form draft of "regression-control-examples"
    When the user clicks "Controls" task on task list page
    And the user enters "hi" in a text field labelled "Single line textbox"
    Then the user views an error message of "must NOT have fewer than 3 characters" under the control labelled "Single line textbox"
    When the user enters "hello" in a text area field labelled "Multiline text area"
    Then the user views an error message of "must NOT have fewer than 10 characters" under the control labelled "Multiline text area"
    When the user clicks Back to application overview link on the form page
    And the user clicks "Standard controls" task on task list page
    And the user enters "111111111" in Social insurance number control
    Then the user views an error message of "Social insurance number is invalid" under the control labelled "Social insurance number"
    When the user clicks Back to application overview link on the form page
    And the user clicks "Summary" task on task list page
    Then the user views "must NOT have fewer than 3 characters" validation error message under "Single line textbox" field of "Controls" on summary page
    And the user views "must NOT have fewer than 10 characters" validation error message under "Multiline text area" field of "Controls" on summary page
    And the user views "Checkbox is required" validation error message under "Checkbox" field of "Controls" on summary page
    And the user views "Radio group is required" validation error message under "Radio group" field of "Controls" on summary page
    And the user views "Data schema enumeration is required" validation error message under "Data schema enumeration" field of "Controls" on summary page
    And the user views "Social insurance number is invalid" validation error message under "Social insurance number" field of "Standard controls" on summary page