Feature: Form app

  @smoke-test
  Scenario: As a grant applicant, I can submit an application
    When a user goes to form app overview site
    Then the user views the overview page of form app

  @accessibility @regression
  Scenario: As a user, I can see the form app overview page without any critical and serious accessibility issues
    When a user goes to form app overview site
    Then no critical or serious accessibility issues on "form app overview" page

  @TEST_CS-3110 @regression
  Scenario: As an authenticated user, I can log in to submit an application
    When an authenticated user is logged in to see "autotest-testFormApp" application
    Then the user views a from draft of "autotest-testFormApp"
    When the user enters "Joe" in a text field labelled "First name"
    And the user enters "Smith" in a text field labelled "Last name"
    And the user enters "1970-10-30" in a date picker labelled "Birthday"
    And the user enters "CA" in a dropdown labelled "Nationality"
    And the user clicks Next button in the form
    And the user selects "Not Married" radio button for the question of "Are you married?"
    And the user "selects" a checkbox labelled "Citizen"
    And the user clicks list with detail button labelled as "Add child" in the form
    And the user enters "John" in list with detail element text field labelled "First name"
    And the user enters "Smith" in list with detail element text field labelled "Last name"
    And the user enters "2010-01-15" in list with detail element date input labelled "Dob"
    And the user clicks Next button in the form
    Then the user views the summary of "Personal Information" with "Joe" as "required" "First name"
    And the user views the summary of "Personal Information" with "Smith" as "required" "Last name"
    And the user views the summary of "Personal Information" with "1970-10-30" as "not required" "Birthday"
    And the user views the summary of "Additional Information" with "No" as "required" "Are you married?"
    And the user views the summary of "Additional Information" with "Yes" as "not required" "Citizen"
    And the user views the summary of "Additional Information" with "John" as "required" "First name:Dependant"
    And the user views the summary of "Additional Information" with "Smith" as "required" "Last name:Dependant"
    And the user views the summary of "Additional Information" with "2010-01-15" as "not required" "Dob:Dependant"
    When the user clicks submit button in the form
    Then the user views a callout with a message of "We're processing your application"
    When the user sends a delete form request
    Then the new form is deleted