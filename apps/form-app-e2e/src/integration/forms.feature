@forms
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
    When the user clicks submit button on form summary page
    Then the user views a callout with a message of "We're processing your application"
    When the user clicks Download PDF copy link on form submission confirmation page
    Then the user views the PDF copy of "autotest-testformapp.pdf" being downloaded
    When the user sends a delete form request
    Then the new form is deleted

  # TEST DATA: autotest-anonymous-submission is created as a form definition with anonymous enabled
  @TEST_CS-3570 @REQ_CS-3484 @REQ_CS-3485 @regression
  Scenario: As an anonymous applicant, I can view and submit an anonymous application
    Given an anonymous applicant goes to "autotest-anonymous-submission" application
    Then the user views an anonymous form draft of "autotest-anonymous-submission"
    When the user enters "Joe" in a text field labelled "First name"
    And the user enters "Smith" in a text field labelled "Last name"
    And the user enters "1970-10-30" in a date picker labelled "Birthday"
    And the user enters "CA" in a dropdown labelled "Nationality"
    And the user clicks Next button in the form
    And the user selects "Not Married" radio button for the question of "Are you married?"
    And the user clicks list with detail button labelled as "Add child" in the form
    And the user enters "John" in list with detail element text field labelled "First name"
    And the user enters "Smith" in list with detail element text field labelled "Last name"
    And the user enters "2010-01-15" in list with detail element date input labelled "Dob"
    And the user clicks Next button in the form
  # Anonymous submission is pretected by reCAPTCHA and Cypress test will fail to pass CAPTCHA validation
  # And the user clicks submit button on form summary page
  # Then the user views a callout with a message of "We're processing your application"

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
  @TEST_CS-4052 @REQ_CS-3812 @REQ_CS-4016 @REQ_CS-3881 @REQ_CS-4015 @REQ_CS-4168 @REQ_CS-4422 @regression
  Scenario: As a form user, I can navigate between the task list and pages, view task status, submit it from summary page
    Given the user deletes any existing form from "Auto Test" for "autotest-tasklist"
    When an authenticated user is logged in to see "autotest-tasklist" application
    Then the user views a form draft of "autotest-tasklist"
    And the user views "Automated Test Application" as the form title
    # Verify the task list page and task status
    And the user views Application Progress with "0 out of 2 items completed" progress status
    And the user views section title of "1. Personal Data" on task list page
    And the user views section title of "2. More Information" on task list page
    And the user views the task of "Personal Information" with "Not started" status
    And the user views the task of "Additional Information" with "Not started" status
    And the user views Summary link as the last link in the table on task list page
    # Verify the link to summary page and back to task list page link
    When the user clicks "Summary" task on task list page
    Then the user views the summary of "Personal Information" with "(none given)" as "required" "First name"
    When the user clicks "Back to task list overview" link on the form page
    # Verify navigation between pages
    And the user clicks "Personal Information" task on task list page
    Then the user views Step "1" of "2" on the form page
    When the user enters "Auto" in a text field labelled "First name"
    And the user enters "Test" in a text field labelled "Last name"
    And the user enters "1970-10-30" in a date picker labelled "Birthday"
    And the user enters "CA" in a dropdown labelled "Nationality"
    And the user clicks Next button on a tasklist step page
    Then the user views Step "2" of "2" on the form page
    When the user clicks "Back to task list overview" link on the form page
    Then the user views the task of "Personal Information" with "Completed" status
    And the user views the task of "Additional Information" with "In progress" status
    When the user clicks "Additional Information" task on task list page
    And the user selects "Not Married" radio button for the question of "Are you married?"
    And the user clicks list with detail button labelled as "Add child" in the form
    And the user enters "John" in list with detail element text field labelled "First name"
    And the user enters "Smith" in list with detail element text field labelled "Last name"
    And the user enters "2010-01-15" in list with detail element date input labelled "Dob"
    And the user clicks Next button on a tasklist step page
    # Verify summary page with all user input data
    Then the user views the summary of "Personal Information" with "Auto" as "required" "First name"
    And the user views the summary of "Personal Information" with "Test" as "required" "Last name"
    And the user views the summary of "Personal Information" with "1970-10-30" as "not required" "Birthday"
    And the user views the summary of "Additional Information" with "No" as "required" "Are you married?"
    And the user views the summary of "Additional Information" with "John:Smith:2010-01-15" as a "Dependant"
    # Submit the form
    When the user clicks submit button on form summary page
    Then the user views a callout with a message of "We're processing your application"
    When the user sends a delete form request
    Then the new form is deleted

  # TEST DATA: autotest-tasklist is created as a form definition with two tasks and a summary page
  @TEST_CS-4663 @REQ_CS-4654 @regression
  Scenario: As a form user, the relevant field or control is focused and brought into view when I select change from the review page
    Given the user deletes any existing form from "Auto Test" for "autotest-tasklist"
    When an authenticated user is logged in to see "autotest-tasklist" application
    Then the user views a form draft of "autotest-tasklist"
    When the user clicks "Summary" task on task list page
    And the user clicks change link for "Last name" field of "Personal Information" on summary page
    Then the user views "Last name" text field is focused and brought into view on the form page
    When the user clicks "Back to task list overview" link on the form page
    And the user clicks "Summary" task on task list page
    And the user clicks change link for "Citizen" field of "Additional Information" on summary page
    Then the user views "Citizen" checkbox is focused and brought into view on the form page

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
    When the user clicks "Back to application overview" link on the form page
    And the user clicks "Standard controls" task on task list page
    And the user enters "111111111" in Social insurance number control under "Social insurance number" label
    Then the user views an error message of "Social insurance number is invalid" under the control labelled "Social insurance number"
    When the user clicks "Back to application overview" link on the form page
    And the user clicks "Summary" task on task list page
    Then the user views "must NOT have fewer than 3 characters" validation error message under "Single line textbox" field of "Controls" on summary page
    And the user views "must NOT have fewer than 10 characters" validation error message under "Multiline text area" field of "Controls" on summary page
    And the user views "Checkbox is required" validation error message under "Checkbox" field of "Controls" on summary page
    And the user views "Radio group is required" validation error message under "Radio group" field of "Controls" on summary page
    And the user views "Data schema enumeration is required" validation error message under "Data schema enumeration" field of "Controls" on summary page
    And the user views "Social insurance number is invalid" validation error message under "Social insurance number" field of "Standard controls" on summary page

  # TEST DATA: regression-control-examples is created with all types of control examples
  @TEST_CS-4003 @regression
  Scenario: As a form user, I can use basic controls in a form
    Given an anonymous applicant goes to "regression-control-examples" application
    Then the user views an anonymous form draft of "regression-control-examples"
    When the user clicks "Controls" task on task list page
    And the user enters "MySingleLineText" in a text field labelled "Single line textbox"
    And the user enters "MyTextAreaText" in a text area field labelled "Multiline text area"
    And the user enters "11.23" in a numeric field labelled "Decimal input"
    And the user enters "100" in a numeric field labelled "Integer input with increment"
    And the user "selects" a checkbox labelled "Checkbox (required)"
    And the user selects "Yes" radio button for the question of "Radio group"
    And the user enters "1970-10-30" in a date picker labelled "Value a"
    And the user enters "16:25:10" in a time picker labelled "Value b"
    # CS-4946: Date time picker has issues
    # And the user enters "2020-01-10T23:10:00" in a date time picker labelled "Value c"
    And the user enters "Option B" in a dropdown labelled "Data schema enumeration"
    And the user enters "Designer" in a dropdown labelled "Register based enumeration"
    # External Dog breed API isn't available any more. Need to have a new API for testing API based enumeration control.
    # And the user enters "border" in a dropdown labelled "API based enumeration"
    # File upload operations get request rejected because captcha verification not successful (401)
    # And the user uploads a file of "test.pdf" using file upload button for "File A"
    # And the user uploads a file of "test-doc.txt" using drag and drop zone for "File B"
    And the user clicks "Back to application overview" link on the form page
    And the user clicks "Summary" task on task list page
    Then the user views the summary of "Controls" with "MySingleLineText" as "not required" "Single line textbox"
    And the user views the summary of "Controls" with "MyTextAreaText" as "not required" "Multiline text area"
    And the user views the summary of "Controls" with "11.23" as "not required" "Decimal input"
    And the user views the summary of "Controls" with "100" as "not required" "Integer input with increment"
    And the user views the summary of "Controls" with "Yes" as "required" "Checkbox"
    And the user views the summary of "Controls" with "Yes" as "required" "Radio group"
    And the user views the summary of "Controls" with "1970-10-30" as "not required" "Value a"
    And the user views the summary of "Controls" with "16:25:10" as "not required" "Value b"
    # And the user views the summary of "Controls" with "2020-01-10 11:10:00 PM" as "not required" "Value c"
    And the user views the summary of "Controls" with "Option B" as "not required" "Data schema enumeration"
    And the user views the summary of "Controls" with "Designer" as "not required" "Register based enumeration"
    And the user "should not view" validation error on the summary of "Controls" for "Register based enumeration"
    # And the user views the summary of "Controls" with "border" as "not required" "API based enumeration"
    And the user "should not view" validation error on the summary of "Controls" for "API based enumeration"

  # TEST DATA: regression-control-examples is created with all types of control examples
  @TEST_CS-4004 @regression
  Scenario: As a form user, I can use basic controls in a form
    Given an anonymous applicant goes to "regression-control-examples" application
    Then the user views an anonymous form draft of "regression-control-examples"
    When the user clicks "Standard controls" task on task list page
    And the user enters "John, Mathew, Smith" in full name control under "Full name" label
    And the user enters "Mary, Jones, Steward, 1978-01-15" in full name and DOB control under "Full name and date of birth" label
    And the user enters "118 Foxboro Way, Sherwood Park, T8A 5Y6" in Alberta postal address control under "Alberta mailing address" label
    And the user enters "1228 Robson St, Vancouver, British Columbia, V6E 1C1" in Canada postal address control under "Canadian mailing address" label
    And the user enters "111111118" in Social insurance number control under "Social insurance number" label
    And the user clicks "Back to application overview" link on the form page
    And the user clicks "Summary" task on task list page
    Then the user views the summary of "Standard controls" with "John" as "not required" "First name" under "Full name" for standard name control
    And the user views the summary of "Standard controls" with "Mathew" as "not required" "Middle name" under "Full name" for standard name control
    And the user views the summary of "Standard controls" with "Smith" as "not required" "Last name" under "Full name" for standard name control
    And the user views the summary of "Standard controls" with "Mary" as "not required" "First name" under "Full name and date of birth" for standard name control
    And the user views the summary of "Standard controls" with "Jones" as "not required" "Middle name" under "Full name and date of birth" for standard name control
    And the user views the summary of "Standard controls" with "Steward" as "not required" "Last name" under "Full name and date of birth" for standard name control
    And the user views the summary of "Standard controls" with "1978-01-15" as "not required" "Date of birth" under "Full name and date of birth" for standard name control
    And the user views the summary of "Standard controls" with "118 Foxboro Way" as "required" "Address line 1" under "Alberta mailing address" for standard postal address control
    And the user views the summary of "Standard controls" with "Sherwood Park" as "required" "City" under "Alberta mailing address" for standard postal address control
    And the user views the summary of "Standard controls" with "T8A 5Y6" as "required" "Postal code" under "Alberta mailing address" for standard postal address control
    And the user views the summary of "Standard controls" with "1228 Robson St" as "required" "Address line 1" under "Canadian mailing address" for standard postal address control
    And the user views the summary of "Standard controls" with "Vancouver" as "required" "City" under "Canadian mailing address" for standard postal address control
    And the user views the summary of "Standard controls" with "British Columbia" as "required" "Province" under "Canadian mailing address" for standard postal address control
    And the user views the summary of "Standard controls" with "V6E 1C1" as "required" "Postal code" under "Canadian mailing address" for standard postal address control
    And the user views the summary of "Standard controls" with "111 111 118" as "not required" "Social insurance number"

  # TEST DATA: regression-control-examples is created with all types of control examples
  @TEST_CS-3993 @regression
  Scenario: As a form user, I can use rule to dynamically change the form based on user input
    Given an anonymous applicant goes to "regression-control-examples" application
    Then the user views an anonymous form draft of "regression-control-examples"
    # Test Hide/Show rule based on radio button input
    When the user clicks "Dynamic elements" task on task list page
    And the user selects "Yes" radio button for the question of "Value a"
    Then the user "should not view" the text field labelled "Hide on true"
    And the user "views" the text field labelled "Show on true"
    When the user enters "YesValueA" in a text field labelled "Show on true"
    And the user clicks "Back to application overview" link on the form page
    And the user clicks "Summary" task on task list page
    Then the user views the summary of "Dynamic elements" with "YesValueA" as "not required" "Show on true"
    When the user clicks "Back to application overview" link on the form page
    And the user clicks "Dynamic elements" task on task list page
    And the user selects "No" radio button for the question of "Value a"
    Then the user "should not view" the text field labelled "Show on true"
    And the user "views" the text field labelled "Hide on true"
    When the user enters "NoValueA" in a text field labelled "Hide on true"
    And the user clicks "Back to application overview" link on the form page
    And the user clicks "Summary" task on task list page
    Then the user views the summary of "Dynamic elements" with "NoValueA" as "not required" "Hide on true"
    # Test Enable/Disable rule based on integer input
    When the user clicks "Back to application overview" link on the form page
    And the user clicks "Dynamic elements" task on task list page
    When the user enters "1" in the integer field labelled "Value a"
    Then the user views the text field of "Enable on even number" is "disabled"
    And the user views the text field of "Disable on even number" is "enabled"
    When the user enters "OddNumber1" in a text field labelled "Disable on even number"
    And the user clicks "Back to application overview" link on the form page
    And the user clicks "Summary" task on task list page
    Then the user views the summary of "Dynamic elements" with "OddNumber1" as "not required" "Disable on even number"
    When the user clicks "Back to application overview" link on the form page
    And the user clicks "Dynamic elements" task on task list page
    And the user enters "2" in the integer field labelled "Value a"
    Then the user views the text field of "Enable on even number" is "enabled"
    And the user views the text field of "Disable on even number" is "disabled"
    When the user enters "EvenNumber2" in a text field labelled "Enable on even number"
    And the user clicks "Back to application overview" link on the form page
    And the user clicks "Summary" task on task list page
    Then the user views the summary of "Dynamic elements" with "EvenNumber2" as "not required" "Enable on even number"

  # TEST DATA: regression-control-examples is created with all types of control examples
  @TEST_CS-4006 @regression
  Scenario: As a form user, I can use object lists in a form
    Given an anonymous applicant goes to "regression-control-examples" application
    Then the user views an anonymous form draft of "regression-control-examples"
    When the user clicks "Object lists" task on task list page
    And the user enters "example1, description1; example2, description2" in "Examples" object array control
    And the user enters "reference1, desc1; reference2, desc2" in "References" List with detail control
    And the user clicks "Back to application overview" link on the form page
    And the user clicks "Summary" task on task list page
    Then the user views the summary of "Object lists" with all entries "example1:description1;example2:description2" as "Examples"
    And the user views the summary of "Object lists" with all entries "reference1:desc1;reference2:desc2" as "References"

  # TEST DATA: autotest-general-complaint is created with conditional required fields
  @TEST_CS-4044 @regression
  Scenario: As a form user, I should be able to submit a form with conditional required fields
    Given an anonymous applicant goes to "autotest-general-complaint" application
    Then the user views an anonymous form draft of "autotest-general-complaint"
    # Fill in all required fields other than the field to test conditional required fields
    When the user enters "Joe" in a text field labelled "First name"
    And the user enters "Smith" in a text field labelled "Last name"
    And the user selects "Email" radio button for the question of "Prefered contact method and follow-up"
    And the user selects "Highway issues" radio button for the question of "Category"
    And the user enters "MyTextAreaText" in a text area field labelled "Please provide the details of the complaint"
    And the user "selects" a checkbox labelled "I agree that the information provided is accurate to the best of my knowledge."
    # Test else condition of conditional required flow
    And the user selects "No" radio button for the question of "Are you submitting a complaint on behalf of someone else?"
    Then the user views the text field labelled "Email address" is required
    And the user views the submit button is "disabled" on the form page
    When the user enters "myEmail@email.com" in a text field labelled "Email address"
    Then the user views the submit button is "enabled" on the form page
    # Test then condition of conditional required flow
    When the user selects "Yes" radio button for the question of "Are you submitting a complaint on behalf of someone else?"
    Then the user views the text field labelled "Email address" is not required
    And the user views the text field labelled "Affected person first name" is required
    And the user views the text field labelled "Affected person last name" is required
    When the user enters "Mary" in a text field labelled "Affected person first name"
    And the user enters "Jones" in a text field labelled "Affected person last name"
    And the user "selects" a checkbox labelled "I certify that I have obtained the appropriate consent and/or legal authority to submit this complaint on behalf of the affected person."
    Then the user views the submit button is "enabled" on the form page
# Due to ReCAPTCHA validation, the test cannot submit the form successfully. The following steps are commented out to avoid test failure.
# When the user clicks submit button on the form page
# Then the user views a callout with a message of "We're processing your application"
