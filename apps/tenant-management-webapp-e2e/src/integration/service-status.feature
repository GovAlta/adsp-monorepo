@service-status
Feature: Service status

  @TEST_CS-528 @REQ_CS-283 @regression
  Scenario: Test As a developer, I can access recommendations about health check, so I can add an appropriate health check to my app
    Given a service owner user is on service status page
    Then the user views the health check guidelines