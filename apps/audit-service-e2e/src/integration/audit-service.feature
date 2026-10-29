@audit-service
Feature: Audit service

  @regression @api
  Scenario: As a developer, I can retrieve the shared audit action catalog
    When a developer sends a request to get audit actions for namespace "auto-test-client"
    Then a 200 response is returned with an actions list

  # Need audit service developer to help on create test data
  @regression @api @ignore
  Scenario: As a developer, I can write an audit event for my tenant namespace
    When a developer sends a request to write an audit event for namespace "autotest-audit-namespace" with action "autotest.create"
    Then a 202 response is returned with accepted count for the audit event write
