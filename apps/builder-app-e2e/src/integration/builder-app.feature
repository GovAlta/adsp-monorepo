@builder-app
Feature: Builder application

  @smoke-test @regression
  Scenario: As a visitor, I can access the builder app landing page
    When the user visits the builder app root
    Then the user views the builder app landing page

  @regression
  Scenario: As a visitor, I see the Keycloak login page when accessing the tenant builder
    When the user navigates to the builder login page for realm "2ef492af-0a16-470b-9ea5-c8bfa7b08a7c"
    Then the user views the Keycloak login form

  # Ignore: builder tenant routes depend on LLM agent-service which is not regression-testable
  @accessibility @regression @ignore
  Scenario: Builder app landing page has no critical or serious accessibility issues
    When the user visits the builder app root
    Then no critical or serious accessibility issues on "builder app landing page"
