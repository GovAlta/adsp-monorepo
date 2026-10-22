@dashboard-metrics
Feature: Dashboard metrics service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can retrieve dashboard metrics for a daily interval
    When a developer sends a request to get daily metrics
    Then a 200 response is returned with metrics data
