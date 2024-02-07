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

  #TEST DATA: precreated calendar of "autotest-calendarAccessibility", "DO NOT DELETE", "auto-test-role1"
  @accessibility @regression
  Scenario: As a tenant admin, I can use calendar pages without any critical or serious accessibility issues
    Given a tenant admin user is on tenant admin page
    When the user selects the "Calendar" menu item
    Then no critical or serious accessibility issues on "calendar overview page"
    When the user clicks Add calendar button on overview tab
    Then the user views Add calendar modal
    And no critical or serious accessibility issues on "calendar add calendar modal"
    When the user clicks Cancel button in Add calendar modal
    Then the user views Calendar tab table header on calendars page
    And no critical or serious accessibility issues on "calendar calendars page"
    When the user clicks "Edit" button for the calendar of "autotest-calendarAccessibility", "DO NOT DELETE"
    Then the user views Edit calendar modal
    And no critical or serious accessibility issues on "calendar edit calendar modal"

  @TEST_CS-330 @REQ_CS-580 @REQ_CS-1652 @REQ_CS-1709 @regression
  Scenario: As a tenant admin, I can add, edit and delete calendars in the tenant admin view
    Given a tenant admin user is on tenant admin page
    When the user selects the "Calendar" menu item
    Then the user views the "Calendar service" overview content "The calendar service provides"
    When the user clicks Add calendar button on overview tab
    Then the user views Add calendar modal
    When the user clicks Cancel button in Add calendar modal
    Then the user views Calendar tab table header on calendars page
    When the user clicks Add calendar button
    Then the user views Add calendar modal
    # Invalid data
    When the user enters "auto-test-1A $" in name field in calendar modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" on namespace in calendar modal
    # Valid data
    When the user enters "autotest-addcalendar", "autotest calendar desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin", "auto-test-role2" in Add calendar modal
    And the user clicks Save button in Add calendar modal
    Then the user "views" the calendar of "autotest-addcalendar", "autotest calendar desc"
    # Edit
    When the user clicks "Edit" button for the calendar of "autotest-addcalendar", "autotest calendar desc"
    Then the user views Edit calendar modal
    When the user enters "autotest calendar desc edit" as description and selects "auto-test-role2", "auto-test-role1" as roles in Edit calendar modal
    And the user clicks Save button in Edit calendar modal
    Then the user "views" the calendar of "autotest-addcalendar", "autotest calendar desc edit"
    # Delete
    When the user clicks "Delete" button for the calendar of "autotest-addcalendar", "autotest calendar desc edit"
    Then the user views delete "calendar" confirmation modal for "autotest-addcalendar"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the calendar of "autotest-addcalendar", "autotest calendar desc edit"
