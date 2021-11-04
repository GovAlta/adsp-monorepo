Feature: public site for service status and notice
  @TEST_CS-590  @REQ_CS-540 @smoke-test @regression
  Scenario: As an interested member of the public, I can go to a common site for service status to see service status information
    Given a user is on the public service status page for "Platform"
    Then the user views the status and outages page

  @TEST_CS-694 @REQ_CS-624 @regression
  Scenario: As an interested member of the public, I can go to a common site for service status to see Platform service status information
    Given a user is on the public service status page for "Platform"
    Then the user views the status and outages page
    And the user views the correct header and release version
    And the user views service statuses for "Access service, Tenant service, File service, Status service"

  @accessibility @regression
  Scenario: As an interested member of the public, I can see the public service status page without any critical and serious accessibility issues
    Given a user is on the public service status page for "Platform"
    Then no critical or serious accessibility issues on public service status page
