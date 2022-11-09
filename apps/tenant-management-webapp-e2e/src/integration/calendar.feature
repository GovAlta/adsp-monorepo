@calendar
Feature: Calendar

  @TEST_CS-1616 @REQ_CS-577 @regression
  Scenario: As a tenant admin, I can see the calendar service overview in tenant admin view
    Given a tenant admin user is on tenant admin page
    When the user selects the "Calendar" menu item
    Then the user views the "Calendar service" overview content "The calendar service provides"
    And the user views the link of API docs for "Calendar service"
    And the user views the link of See the code for "calendar-service"
    And the user views the link of "Get support" under Support

  @accessibility @regression
  Scenario: As a service admin, I can use calendar pages without any critical or serious accessibility issues
    Given a tenant admin user is on tenant admin page
    When the user selects the "Calendar" menu item
    Then no critical or serious accessibility issues on "calendar overview page"
# CS-1827 pending for fix
# When the user selects "Calendars" tab for "Calendar"
# Then no critical or serious accessibility issues on "calendar calendars page"