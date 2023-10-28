@calendar
Feature: Calendar

  # @TEST_CS-1616 @REQ_CS-577 @regression
  # Scenario: As a tenant admin, I can see the calendar service overview in tenant admin view
  #   Given a tenant admin user is on tenant admin page
  #   When the user selects the "Calendar" menu item
  #   Then the user views the "Calendar service" overview content "The calendar service provides"
  #   And the user views the link of API docs for "Calendar service"
  #   And the user views the link of See the code for "calendar-service"
  #   And the user views the link of "Get support" under Support

  # @accessibility @regression
  # Scenario: As a tenant admin, I can use calendar pages without any critical or serious accessibility issues
  #   Given a tenant admin user is on tenant admin page
  #   When the user selects the "Calendar" menu item
  #   Then no critical or serious accessibility issues on "calendar overview page"
  #   When the user selects "Calendars" tab for "Calendar"
  #   Then no critical or serious accessibility issues on "calendar calendars page"

  # @TEST_CS-330 @REQ_CS-580 @REQ_CS-1652 @REQ_CS-1709 @regression
  # Scenario: As a tenant admin, I can add, edit and delete calendars in the tenant admin view
  #   Given a tenant admin user is on tenant admin page
  #   When the user selects the "Calendar" menu item
  #   Then the user views the "Calendar service" overview content "The calendar service provides"
  #   When the user clicks Add calendar button on overview tab
  #   Then the user views Add calendar modal
  #   When the user clicks Cancel button in Add calendar modal
  #   Then the user views Calendar tab table header on calendars page
  #   When the user clicks Add calendar button
  #   Then the user views Add calendar modal
  #   # Invalid data
  #   When the user enters "auto-test-1A $" in name field in calendar modal
  #   Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" on namespace in calendar modal
  #   # Validate data
  #   When the user enters "autotest-addcalendar", "autotest calendar desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin" in Add calendar modal
  #   And the user clicks Save button in Add calendar modal
  #   Then the user "views" the calendar of "autotest-addcalendar", "autotest calendar desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin"
  #   # Edit
  #   When the user clicks "Edit" button for the calendar of "autotest-addcalendar", "autotest calendar desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin"
  #   Then the user views Edit calendar modal
  #   When the user enters "autotest calendar desc edit" as description and selects "auto-test-role2" as role in Edit calendar modal
  #   And the user clicks Save button in Edit calendar modal
  #   Then the user "views" the calendar of "autotest-addcalendar", "autotest calendar desc edit", "auto-test-role2"
  #   # Delete
  #   When the user clicks "Delete" button for the calendar of "autotest-addcalendar", "autotest calendar desc edit", "auto-test-role2"
  #   Then the user views delete "calendar" confirmation modal for "autotest-addcalendar"
  #   When the user clicks Delete button in delete confirmation modal
  #   Then the user "should not view" the calendar of "autotest-addcalendar", "autotest script desc edit", "auto-test-role2"

  @TEST_CS-2459 @TEST_CS-2460 @TEST_CS-2477 @TEST_CS-2478 @REQ_CS-1653 @REQ_CS-1675 @REQ_CS-1676 @REQ_CS-1677 @regression
  Scenario: Test As a tenant admin, I can view the events in a calendar, so can see what is scheduled
    Given a tenant admin user is on tenant admin page
    When the user selects the "Calendar" menu item
    And the user selects "Events" tab for "Calendar service"
    Then the user views Calendar Events page
    When the user selects "Test" calendar from calendar dropdown
    Then the user views "There are no events available between the selected dates in this calendar" on calendar events page
    When the user selects "test-calendar" calendar from calendar dropdown
    When the user clicks Add event button
    Then the user views Add event modal
    And the user clicks Save button in Add event modal
    # Invalid data
    Then the user views the error message of "name is required" on name in event modal
    And the user clicks Cancel button in Add event modal
    # Validate data
    When the user clicks Add event button
    When the user enters "autotest-addEvent", "autotest Event desc", "yesAllDay", "noPublic" in Add event modal
    And the user clicks Save button in Add event modal
    # Then the user views Event page for "autotest-addEvent"
    # Edit
    #  When the user clicks "Edit" button for the event of "autotest-addEvent"
  # Then the user views Edit event modal
  # When the user enters "autotest-EditEvent" as name in Edit event modal
  #   And the user clicks Save button in Edit calendar modal
  #   Then the user "views" the calendar of "autotest-addcalendar", "autotest calendar desc edit", "auto-test-role2"
  #   # Delete

    # Delete