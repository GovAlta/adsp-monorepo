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
    And the user views service statuses for "Access service, Event service, File service, Status service, Notification service"

  @accessibility @regression
  Scenario: As an interested member of the public, I can see the public service status page without any critical and serious accessibility issues
    Given a user is on the public service status page for "Platform"
    Then no critical or serious accessibility issues on public service status page

  @TEST_CS-889 @regression
  Scenario: As an interested stakeholder, I can see the time zone information on status app
    Given a user is on the public service status page for "Platform"
    Then the user views the status and outages page
    And the user views the timezone information

  #TEST DATA: an all application notice message of "Published notice - AUTOMATION USE ONLY" is created for autotest tenant
  @regression
  Scenario: As an interested stakeholder, I can see application notices
    Given a user is on the public service status page for "autotest"
    Then the user views the status and outages page
    And the user views the all services notice of "Published notice - AUTOMATION USE ONLY"
