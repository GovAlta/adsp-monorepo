Feature: Events

  @regression
  Scenario: As a service owner, I can see events overview and events documentation
    Given a service owner user is on tenant admin page
    When the user selects the "Events" menu item
    Then the user views events overview page
    When the user selects "Documentation" tab
    Then the user views the events documentation

  @regression
  Scenario: As a service owner, I can see details of event definitions
    Given a service owner user is on tenant admin page
    When the user selects the "Events" menu item
    And the user selects "Definitions" tab
# The event definition table will need to be revamped based on future UI design and the following steps will be done after UI is finalized
# Then the user views an event definition of "auto-test-service", "auto-test-event" and "autotest event description"
# When the user clicks show details button for the definition of "auto-test-service", "auto-test-event" and "autotest event description"
# Then the user views the definition details of "auto-test-service", "auto-test-event" and "autotest event description"
# When the user clicks hide details button for the definition of "auto-test-service", "auto-test-event" and "autotest event description"
# Then the definition details of "auto-test-service", "auto-test-event" and "autotest event description" is hidden