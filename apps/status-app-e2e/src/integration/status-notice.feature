Feature: public site for service status and notice

  @TEST_CS-590 @REQ_CS-540 @smoke-test @regression
  Scenario: As an interested member of the public, I can go to a common site for service status to see service status information
    Given a user is on the public service status page
    Then the user views the status and outages page
    And the user views the correct header and release version