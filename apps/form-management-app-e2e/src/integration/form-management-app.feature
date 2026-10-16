@form-management-app
Feature: Form management application

  @smoke-test @regression
  Scenario: As a visitor, I see the Keycloak login page for the form management app
    When the user navigates to the form management login page for tenant "autotest"
    Then the user views the Keycloak login form

  @regression
  Scenario: As an authenticated form admin, I can see the form management overview page
    Given an authenticated user is logged into the form management app for tenant "autotest"
    Then the user views the form management overview page

  @regression
  Scenario: As an authenticated form admin, I can navigate to the forms definitions list
    Given an authenticated user is logged into the form management app for tenant "autotest"
    When the user navigates to the forms definitions page
    Then the user views the form definitions list

  @regression
  Scenario: As an authenticated form admin, I can navigate to the form filters page
    Given an authenticated user is logged into the form management app for tenant "autotest"
    When the user navigates to the form filters page
    Then the user views the form filters content

  # Ignore pending resolution of GoA web component accessibility issues
  @accessibility @regression @ignore
  Scenario: Form management overview page has no critical or serious accessibility issues
    Given an authenticated user is logged into the form management app for tenant "autotest"
    Then no critical or serious accessibility issues on "form management overview page"
