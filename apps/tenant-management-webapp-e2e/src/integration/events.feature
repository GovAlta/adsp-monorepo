Feature: Events

  @regression
  Scenario: As a service admin, I can see events overview
    Given a service owner user is on tenant admin page
    When the user selects the "Events" menu item
    Then the user views events overview page

  @regression
  Scenario: As a service admin, I can see details of event definitions
    Given a service owner user is on tenant admin page
    When the user selects the "Events" menu item
    And the user selects "Definitions" tab
  # The event definition table will need to be revamped based on future UI design and the following steps will be done after UI is finalized
  # Then the user views an event definition of "auto-test-service", "auto-test-event" and "autotest event description"
  # When the user clicks show details button for the definition of "auto-test-service", "auto-test-event" and "autotest event description"
  # Then the user views the definition details of "auto-test-service", "auto-test-event" and "autotest event description"
  # When the user clicks hide details button for the definition of "auto-test-service", "auto-test-event" and "autotest event description"
  # Then the definition details of "auto-test-service", "auto-test-event" and "autotest event description" is hidden

  @regression
  Scenario: As a service admin, I can see event service API docs
    Given a service owner user is on tenant admin page
    When the user selects the "Events" menu item
    Then the user views the link for "Event Service" API docs
    When the user goes to the web link of the API docs
    Then the user views "Event Service" API documentation