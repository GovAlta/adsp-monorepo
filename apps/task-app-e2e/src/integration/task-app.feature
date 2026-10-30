@task-app
Feature: Task management application

  @smoke-test @regression
  Scenario: As a visitor, I can see the task management landing page
    When the user goes to the task management overview page
    Then the user views the task management landing page heading

  @regression
  Scenario: As a visitor, I see the Keycloak login form when accessing the tenant login page
    When the user navigates to the login page for tenant "autotest"
    Then the user views the Keycloak login form

  @regression
  Scenario: As an authenticated task worker, I can see the task queues for my tenant
    Given an authenticated user is logged into the task management app for tenant "autotest"
    Then the user views the task queues page

  @regression
  Scenario: As an authenticated task worker, I can open a task queue and see tasks
    Given an authenticated user is logged into the task management app for tenant "autotest"
    When the user opens the first available task queue
    Then the user views the task queue tasks page

  @accessibility @regression
  Scenario: Task management overview page has no critical or serious accessibility issues
    When the user goes to the task management overview page
    Then no critical or serious accessibility issues on "task management overview page" page
