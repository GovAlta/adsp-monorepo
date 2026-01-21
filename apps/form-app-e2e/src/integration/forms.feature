Feature: Form app

  @smoke-test
  Scenario: As a grant applicant, I can submit an application
    When a user goes to form app overview site
    Then the user views the overview page of form app

  @accessibility @regression
  Scenario: As a user, I can see the form app overview page without any critical and serious accessibility issues
    When a user goes to form app overview site
    Then no critical or serious accessibility issues on "form app overview" page

  # CS-4586: Ignore the test until the test is updated to work with the new summary page
  # New date picker doesn't allow type in date input, so date picker related tests are commented out for now
  @TEST_CS-3110 @TEST_CS-3459 @REQ_CS-2909 @regression @prod @ignore
  Scenario: As an authenticated user, I can log in to submit an application
    Given the user deletes any existing form from "Auto Test" for "autotest-testformapp"
    When an authenticated user is logged in to see "autotest-testformapp" application
    Then the user views a form draft of "autotest-testformapp"
    When the user enters "Joe" in a text field labelled "First Name"
    And the user enters "Smith" in a text field labelled "Last Name"
    # And the user enters "1970-10-30" in a date picker labelled "Birthday"
    And the user enters "CA" in a dropdown labelled "Nationality"
    And the user clicks Next button in the form
    And the user selects "Not Married" radio button for the question of "Are you married?"
    # Using both radio button and checkbox causing the review page validation fail randomly. Remove checkbox user input for now.
    # And the user "selects" a checkbox labelled "Citizen"
    And the user clicks list with detail button labelled as "Add child" in the form
    And the user enters "John" in list with detail element text field labelled "First Name"
    And the user enters "Smith" in list with detail element text field labelled "Last Name"
    # And the user enters "2010-01-15" in list with detail element date input labelled "Dob"
    And the user clicks Next button in the form
    Then the user views the summary of "Personal Information" with "Joe" as "required" "First Name"
    And the user views the summary of "Personal Information" with "Smith" as "required" "Last Name"
    # And the user views the summary of "Personal Information" with "1970-10-30" as "not required" "Birthday"
    And the user views the summary of "Additional Information" with "No" as "required" "Are you married?"
    # And the user views the summary of "Additional Information" with "Yes" as "not required" "Citizen"
    # Validation of list with detail on review page is commented out until CS-3120 is fixed
    # And the user views the summary of "Additional Information" with "John" as "required" "First Name:Dependant"
    # And the user views the summary of "Additional Information" with "Smith" as "required" "Last Name:Dependant"
    # And the user views the summary of "Additional Information" with "2010-01-15" as "not required" "Dob:Dependant"
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
    And the user clicks submit button in the form
    Then the user views a callout with a message of "We're processing your application"

  # CS-4586: Ignore the test until the test is updated to work with the new summary page
  # TEST DATA: autotest-anonymous-submission is created as a form definition with anonymous enabled
  @TEST_CS-3571 @REQ_CS-3484 @REQ_CS-3485 @regression @prod @ignore
  Scenario: As an anonymous applicant, I can see validation errors on missing required fields and cannot submit the form without all required fields being set
    Given an anonymous applicant goes to "autotest-anonymous-submission" application
    Then the user views an anonymous form draft of "autotest-anonymous-submission"
    When the user enters "Joe" in a text field labelled "First Name"
    # And the user enters "1970-10-30" in a date picker labelled "Birthday"
    And the user enters "CA" in a dropdown labelled "Nationality"
    And the user clicks Next button in the form
    And the user clicks list with detail button labelled as "Add child" in the form
    And the user enters "John" in list with detail element text field labelled "First Name"
    And the user enters "Smith" in list with detail element text field labelled "Last Name"
    # And the user enters "2010-01-15" in list with detail element date input labelled "Dob"
    And the user clicks Next button in the form
    Then the user views "Last Name is required" validation message under "Last Name" field on summary page
    And the user views "Are you married? is required" validation message under "Are you married?" field on summary page
    And the user views the submit button is disabled on summary page

  # TEST DATA: autotest-open-intake is created as a form definition with an open intake period
  @TEST_CS-4319 @REQ_CS-2954 @regression
  Scenario: As a form applicant, I can apply during an open intake period
    Given the user deletes any existing form from "Auto Test" for "autotest-open-intake"
    When an authenticated user is logged in to see "autotest-open-intake" application
    Then the user views a drafted form for "autotest-open-intake"


  # TEST DATA: autotest-closed-intake is created as a form definition with an open intake period in the past
  #@TEST_CS-4567 @REQ_CS-2954 @regression
  #Scenario: As a form applicant, I cannot apply outside open intake period(s)
  #  When an authenticated user is logged in to see "autotest-closed-intake" application
  #  Then the user views a callout message of "This form is not available at this time"

  # TEST DATA: autotest-closed-submitted is created as a form definition with an open intake period in the past and an application already submitted by the test user
  @TEST_CS-4568 @REQ_CS-2954 @regression
  Scenario: As a form applicant, I cannot apply outside an open intake period
    When an authenticated user is logged in to see "autotest-closed-submitted" application
    Then the user views a success callout message of "We're processing your application"