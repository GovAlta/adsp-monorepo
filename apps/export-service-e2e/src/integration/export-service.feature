@export-service
Feature: Export service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can create an export job for a platform resource
    When a developer submits an export job for "urn:ads:platform:directory-service:v2:/namespaces/platform/entries" as "json"
    Then a 200 response is returned with an export job id

  @regression @api
  Scenario: As a developer, I can retrieve the status of an export job
    When a developer submits an export job for "urn:ads:platform:directory-service:v2:/namespaces/platform/entries" as "json"
    And a developer retrieves the export job status
    Then a 200 response is returned with export job status

  @regression @api
  Scenario: As a developer, I can create an export job in CSV format
    When a developer submits an export job for "urn:ads:platform:directory-service:v2:/namespaces/platform/entries" as "csv"
    Then a 200 response is returned with an export job id
