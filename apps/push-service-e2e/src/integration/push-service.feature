@push-service
Feature: Push service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can list push service streams for my tenant
    When a developer sends a request to list push service streams
    Then a 200 response is returned with a streams list

  @regression @api
  Scenario: As a developer, I cannot access push service streams without authentication
    When a developer sends an unauthenticated request to list push service streams
    Then a 401 response is returned

  @regression @api
  Scenario: As a developer, I can retrieve configuration for a specific push stream
    When a developer sends a request to get push stream details for "autotest-stream"
    Then a 200 response or 404 response is returned for the stream details request
