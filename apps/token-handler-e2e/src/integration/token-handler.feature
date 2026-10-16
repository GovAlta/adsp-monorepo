@token-handler
Feature: Token handler service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can list registered token handler clients
    When a developer sends a request to list token handler clients
    Then a 200 response is returned with a clients list

  @regression @api
  Scenario: As a developer, I cannot list token handler clients without authentication
    When a developer sends an unauthenticated request to list token handler clients
    Then a 401 response is returned

  @regression @api
  Scenario: As a developer, I can retrieve details for a specific token handler client
    When a developer retrieves the first registered token handler client
    Then a 200 response is returned with the client details
