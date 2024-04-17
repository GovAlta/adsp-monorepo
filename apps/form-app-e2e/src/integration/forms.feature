Feature: Form app

  # @smoke-test
  # Scenario: As a grant applicant, I can submit an application
  #   When a user goes to form app overview site
  #   Then the user views the overview page of form app

  # @accessibility @regression
  # Scenario: As a user, I can see the form app overview page without any critical and serious accessibility issues
  #   When a user goes to form app overview site
  #   Then no critical or serious accessibility issues on "form app overview" page

  @regression
  Scenario: As an authenticated user, I can log in to see my application form
    When an authenticated user is logged in to see "howard-test-nostepper" application
    Then the user views the start application page for "howard-test-nostepper"
# When the user clicks Start application button
# Then the user views the application for "howard-test-nostepper"