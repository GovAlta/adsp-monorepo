@form-service
Feature: Form service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can retrieve form definitions for my tenant
    When a developer sends a request to list form definitions
    Then a 200 response is returned with a definitions list

  @regression @api
  Scenario: As a developer, I can create a form from a definition
    When a developer sends a request to create a form from definition "autotest-form"
    Then a 200 response or 404 response is returned for the form creation request

  @regression @api
  Scenario: As a developer, I can retrieve a list of forms
    When a developer sends a request to list forms
    Then a 200 response is returned with a forms list
