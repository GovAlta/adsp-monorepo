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

    # #TEST DATA: precreated calendar of "autotest-accessibility", "DO NOT DELETE", "auto-test-role1"
    # @accessibility @regression
    # Scenario: As a tenant admin, I can use calendar pages without any critical or serious accessibility issues
    #   Given a tenant admin user is on tenant admin page
    #   When the user selects the "Calendar" menu item
    #   Then no critical or serious accessibility issues on "calendar overview page"
    #   When the user clicks Add calendar button on overview tab
    #   Then the user views Add calendar modal
    #   And no critical or serious accessibility issues on "calendar add calendar modal"
    #   When the user clicks Cancel button in Add calendar modal
    #   Then the user views Calendar tab table header on calendars page
    #   And no critical or serious accessibility issues on "calendar calendars page"
    #   When the user clicks "Edit" button for the calendar of "autotest-accessibility", "DO NOT DELETE"
    #   Then the user views Edit calendar modal
    #   And no critical or serious accessibility issues on "calendar edit calendar modal"

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
    #   # Valid data
    #   When the user enters "autotest-addcalendar", "autotest calendar desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin", "auto-test-role2" in Add calendar modal
    #   And the user clicks Save button in Add calendar modal
    #   Then the user "views" the calendar of "autotest-addcalendar", "autotest calendar desc"
    #   # Edit
    #   When the user clicks "Edit" button for the calendar of "autotest-addcalendar", "autotest calendar desc"
    #   Then the user views Edit calendar modal
    #   When the user enters "autotest calendar desc edit" as description and selects "auto-test-role2", "auto-test-role1" as roles in Edit calendar modal
    #   And the user clicks Save button in Edit calendar modal
    #   Then the user "views" the calendar of "autotest-addcalendar", "autotest calendar desc edit"
    #   # Delete
    #   When the user clicks "Delete" button for the calendar of "autotest-addcalendar", "autotest calendar desc edit"
    #   Then the user views delete "calendar" confirmation modal for "autotest-addcalendar"
    #   When the user clicks Delete button in delete confirmation modal
    #   Then the user "should not view" the calendar of "autotest-addcalendar", "autotest calendar desc edit"

    # #TEST DATA: precreated calendar of "autotest-calendar", "DO NOT DELETE", "auto-test-role1, auto-test-role2"
    # @TEST_CS-2460 @TEST_CS-2459 @TEST_CS-2477 @TEST_CS-2478 @REQ_CS-1675 @REQ_CS-1653 @REQ_CS-1677 @REQ_CS-1676 @regression
    # Scenario: As a tenant admin, I can add, edit and delete calendar-events
    #   Given a tenant admin user is on calendar service overview page
    #   When the user selects "Events" tab for "Calendar"
    #   # Add an event
    #   And the user selects "autotest-calendar" in Select a calendar on Events page
    #   And the user clicks Add Event button on events page
    #   Then the user views Add calendar event modal
    #   # Invalid name
    #   When the user enters "auto-test-1A $" in name field in Add calendar event modal
    #   Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" on name in Add calendar event modal
    #   # Invalid dates
    #   When the user enters "autotest-addEvent", "autotest event desc", "yes", "no", "Today", "10:30 am", "Today", "10:00 am" in calendar event modal
    #   And the user clicks Save button in calendar event modal
    #   Then the user views the error message of "End of event must be after start of event." on dates in Add calendar event modal
    #   # Valid data
    #   When the user enters "autotest-addEvent", "autotest event desc", "yes", "no", "Today", "10:30 am", "Today", "10:30 pm" in calendar event modal
    #   And the user clicks Save button in calendar event modal
    #   Then the user "views" the event of "autotest-addEvent", "Today, 10:30 AM", "Today, 10:30 PM"
    #   # Edit event
    #   When the user clicks "edit" icon of "autotest-addEvent", "Today, 10:30 AM", "Today, 10:30 PM"
    #   Then the user views Edit calendar event modal
    #   When the user enters "autotest-editEvent", "autotest event desc edited", "yes", "yes", "Today", "10:30 am", "Today", "10:30 pm" in calendar event modal
    #   And the user clicks Cancel button in calendar event modal
    #   Then the user "views" the event of "autotest-addEvent", "Today, 10:30 AM", "Today, 10:30 PM"
    #   When the user clicks "edit" icon of "autotest-addEvent", "Today, 10:30 AM", "Today, 10:30 PM"
    #   Then the user views Edit calendar event modal
    #   When the user enters "autotest-editEvent", "autotest event desc edited", "no", "yes", "Today", "10:30 am", "Today", "10:30 pm" in calendar event modal
    #   And the user clicks Save button in calendar event modal
    #   Then the user "views" the event of "autotest-editEvent", "Today", "Today"
    #   # Delete event
    #   When the user clicks "delete" icon of "autotest-editEvent", "Today", "Today"
    #   Then the user views delete "calendar event" confirmation modal for "autotest-editEvent"
    #   When the user clicks Cancel button in delete confirmation modal
    #   Then the user "views" the event of "autotest-editEvent", "Today", "Today"
    #   When the user clicks "delete" icon of "autotest-editEvent", "Today", "Today"
    #   Then the user views delete "calendar event" confirmation modal for "autotest-editEvent"
    #   When the user clicks Delete button in delete confirmation modal
    #   Then the user "should not view" the event of "autotest-editEvent", "Today", "Today"

    @TEST_CS-4116 @REQ_CS-3587 @regression
    Given a tenant admin user is on Calendar service Calendars page
    Then the user views "Form intake" core calendar under Core cenlendars
    And the user views only view details action on Calendars page
    When the user clicks "view details" action for "Form intake" core calendar
    Then the user views the calendar details modal for "Form intake"
    And the user views "Form intake" as calendar name in calendar details modal
    Then the user views roles "autotest" for read and modify in calendar details modal