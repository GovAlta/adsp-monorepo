@api-docs-app
Feature: API documentation app

  @smoke-test @regression @api
  Scenario: As a developer, I can access the ADSP API documentation portal
    When a developer sends a request to the API documentation app root
    Then a 200 response is returned with the swagger UI page

  @regression @api
  Scenario: As a developer, I can access platform service documentation
    When a developer sends a request to platform service docs for "event-service"
    Then a 200 response is returned for the service documentation
