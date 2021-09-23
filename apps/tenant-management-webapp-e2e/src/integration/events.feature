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
    And the user selects "Definitions" tab for "Events"
    Then the user views an event definition of "tenant-created" under "tenant-service"
    When the user clicks "show" details button for the definition of "tenant-created" under "tenant-service"
    Then the user "views" the definition details of "tenant-created" under "tenant-service"
    When the user clicks "hide" details button for the definition of "tenant-created" under "tenant-service"
    Then the user "should not view" the definition details of "tenant-created" under "tenant-service"

  @regression
  Scenario: As a service admin, I can see event service API docs
    Given a service owner user is on tenant admin page
    When the user selects the "Events" menu item
    Then the user views the link for "Event Service" API docs
    When the user goes to the web link of the API docs
    Then the user views "Event Service" API documentation

  # Test on Monaco editor for payload schema isn't included and will need to be tested in future
  @regression
  Scenario: As a service admin, I can see add, edit and delete an event definition
    Given a service owner user is on tenant admin page
    When the user selects the "Events" menu item
    And the user selects "Definitions" tab for "Events"
    And the user clicks Add Definition button
    Then the user views Add Definition dialog
    When the user enters "Autotest-Service" in Namespace, "autotest-eventname" in Name, "autotest event desc" in Description
    And the user clicks Save button on Definition modal
    Then the user "views" an event definition of "autotest-eventname" and "autotest event desc" under "Autotest-Service"
    When the user clicks "Edit" button for the definition of "autotest-eventname" and "autotest event desc" under "Autotest-Service"
    Then the user views Edit Definition dialog
    When the user enters "autotest event desc2" in Description
    And the user clicks Save button on Definition modal
    Then the user "views" an event definition of "autotest-eventname" and "autotest event desc2" under "Autotest-Service"
    When the user clicks "Delete" button for the definition of "autotest-eventname" and "autotest event desc2" under "Autotest-Service"
    Then the user views Delete Definition dialog for the definition of "autotest-eventname"
    And the user clicks Confirm button
    Then the user "should not view" an event definition of "autotest-eventname" and "autotest event desc2" under "Autotest-Service"

# The accessibility test is commented out until the serious accessibility issue is fixed
# @accessibility @regression
# Scenario: As a service admin, I can use event definitions page without any critical or serious accessibility issues
#   Given a service owner user is on tenant admin page
#   When the user selects the "Events" menu item
#   And the user selects "Definitions" tab for "Events"
#   Then no critical or serious accessibility issues on "event definitions page"