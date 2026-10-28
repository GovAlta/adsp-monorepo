@agent-service
Feature: Agent service

  @regression @api
  Scenario: As a developer, I can list configured agents for my tenant
    When a developer sends a request to list agents
    Then a 200 response is returned with an agents list

  @regression @api
  Scenario: As a developer, I cannot list agents without authentication
    When a developer sends an unauthenticated request to list agents
    Then a 401 response is returned

  @regression @api
  Scenario: As a developer, I can retrieve metadata for a specific agent
    When a developer sends a request to get agent details for "AccessServiceAgent"
    Then a 200 response is returned with the agent details

  @smoke-test @api @ignore
  Scenario: As a developer, I can send a message to an agent and receive a response
    When a developer sends a message to agent "AccessServiceAgent" with content "Hello, which access service environment am I connected to?"
    Then a 200 response is returned with agent message content
