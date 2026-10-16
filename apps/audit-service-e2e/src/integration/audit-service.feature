@audit-service
Feature: Audit service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can retrieve the audit action catalog for my tenant namespace
    When a developer sends a request to get audit actions for namespace "autotest"
    Then a 200 response is returned with an actions list

  @regression @api
  Scenario: As a developer, I can write an audit event for my tenant namespace
    When a developer sends a request to write an audit event for namespace "autotest" with action "autotest-action"
    Then a 202 response is returned with accepted count for the audit event write
