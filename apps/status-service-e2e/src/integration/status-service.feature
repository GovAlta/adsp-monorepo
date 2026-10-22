@status-service
Feature: Status service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can retrieve the list of applications for my tenant
    When a developer sends a request to list status service applications
    Then a 200 response is returned with a status applications list

  @regression @api
  Scenario: As a developer, I can retrieve the list of notices
    When a developer sends a request to list status service notices
    Then a 200 response is returned with a notices list

  @regression @api
  Scenario: As a developer, I can create and delete a status service notice
    When a developer creates a status service notice with message "E2E regression test notice"
    Then a 200 response is returned for the notice creation
    And a developer deletes the created status service notice
    Then a 200 response is returned for the notice deletion
