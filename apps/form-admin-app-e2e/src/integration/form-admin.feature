@form-admin
Feature: Form admin app

  @smoke-test @regression
  Scenario: As a form admin user, I can log in to form admin app and view the form admin page
    Given an authenticated user is logged into form admin app site
    Then the user views the form administration page

  @regression
  Scenario: As a form admin user, I can see the list of form definitions
    Given an authenticated user is logged into form admin app site
    Then the user views the form administration page
    When the user navigates to the form definitions list
    Then the user views the form definitions table with at least one definition

  @regression
  Scenario: As a form admin user, I can open a form definition to see its details
    Given an authenticated user is logged into form admin app site
    When the user navigates to the form definitions list
    And the user selects the first form definition from the list
    Then the user views the form definition detail page

  @regression
  Scenario: As a form admin user, I can see form responses for a definition
    Given an authenticated user is logged into form admin app site
    When the user navigates to the form definitions list
    And the user selects the first form definition from the list
    Then the user views the responses page for the form definition

  @accessibility @regression @ignore
  Scenario: As a form admin user, I can use the form admin app without critical accessibility issues
    Given an authenticated user is logged into form admin app site
    Then no critical or serious accessibility issues on "form admin overview page"