Feature: Form admin app

  @smoke-test
  Scenario: As a form admin user, I can log in to form admin app and view the form admin page
    Given an authenticated user is logged into form admin app site
    Then the user views the form administration page