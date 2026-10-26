@task-service
Feature: Task service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can retrieve task queues configured for my tenant
    When a developer sends a request to list task queues
    Then a 200 response is returned with a queues list

  @regression @api
  Scenario: As a developer, I can create a task in a queue
    When a developer sends a request to create a task in namespace "autotest" queue "e2e-test-queue"
    Then a 200 response or 404 response is returned for the task creation request

  @regression @api
  Scenario: As a developer, I can list all tasks
    When a developer sends a request to list all tasks
    Then a 200 response is returned with a tasks list
