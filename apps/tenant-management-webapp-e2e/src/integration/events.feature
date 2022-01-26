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
    Then the user views the link for "Event service" API docs
    When the user goes to the web link of the API docs
    Then the user views "Event service" API documentation

  # Test on Monaco editor for payload schema isn't included and will need to be tested in future
  @TEST_CS-735 @REQ_CS-250 @regression
  Scenario: As a service admin, I can see add, edit and delete an event definition
    Given a service owner user is on tenant admin page
    When the user selects the "Events" menu item
    And the user selects "Definitions" tab for "Events"
    And the user clicks Add definition button
    Then the user views Add definition dialog
    When the user enters "Autotest-Service" in Namespace, "autotest-eventname" in Name, "autotest event desc" in Description
    And the user clicks Save button on Definition modal
    Then the user "views" an event definition of "autotest-eventname" and "autotest event desc" under "Autotest-Service"
    When the user clicks "Edit" button for the definition of "autotest-eventname" and "autotest event desc" under "Autotest-Service"
    Then the user views Edit definition dialog
    When the user enters "autotest event desc2" in Description
    And the user clicks Save button on Definition modal
    Then the user "views" an event definition of "autotest-eventname" and "autotest event desc2" under "Autotest-Service"
    When the user clicks "Delete" button for the definition of "autotest-eventname" and "autotest event desc2" under "Autotest-Service"
    Then the user views Delete definition dialog for the definition of "autotest-eventname"
    And the user clicks Confirm button on Delete definition modal
    Then the user "should not view" an event definition of "autotest-eventname" and "autotest event desc2" under "Autotest-Service"

  @accessibility @regression
  Scenario: As a service admin, I can use event definitions page without any critical or serious accessibility issues
    Given a service owner user is on tenant admin page
    When the user selects the "Events" menu item
    And the user selects "Definitions" tab for "Events"
    Then no critical or serious accessibility issues on "event definitions page"

  @TEST_CS-739 @REQ_CS-250 @regression
  Scenario Outline: As a service owner, I cannot add event definitions with names or namespaces contains ":"
    Given a service owner user is on event definitions page
    When the user clicks Add definition button
    And the user enters "<Namespace>" in Namespace, "<Name>" in Name, "<Description>" in Description
    And the user clicks Save button on Definition modal
    Then the user views the "<Error Message>" for "<Error Field>"
    When the user clicks Cancel button on Definition modal
    Then the user exits the add definition dialog
    Examples:
      | Namespace           | Name           | Description    | Error Message                  | Error Field |
      | autotest-name:space | autotest-name  | auto-test-desc | Must not contain `:` character | Namespace   |
      | autotest-namespace  | autotest-na:me | auto-test-desc | Must not contain `:` character | Name        |

  @TEST_CS-740 @REQ_CS-250 @regression
  Scenario: As a service owner, I cannot add/modify/delete event definitions within platform service namespaces
    Given a service owner user is on event definitions page
    Then the user only views show button for event definitions of "tenant-service, configuration-service, notification-service, value-service, file-service"
    When the user clicks Add definition button
    And the user enters "tenant-service" in Namespace, "test" in Name, "test" in Description
    And the user clicks Save button on Definition modal
    Then the user views the "Cannot add definitions to core namespaces" for "Namespace"
    When the user clicks Cancel button on Definition modal
    Then the user exits the add definition dialog

  @TEST_CS-930 @REQ_CS-897 @regression
  Scenario: As a tenant admin, I can see health check event definitions for the status service, so that I know what events are available.
    Given a service owner user is on event definitions page
    Then the user "views" an event definition of "health-check-started" and "Signalled when healthcheck started for an event" under "status-service"
    And the user "views" an event definition of "health-check-stopped" and "Signalled when an application health check is stopped." under "status-service"
    And the user "views" an event definition of "application-unhealthy" and "Signalled when an application is determined to be unhealthy by the health check." under "status-service"
    And the user "views" an event definition of "application-healthy" and "Signalled when an application is determined to be healthy by the health check." under "status-service"
    When the user clicks "show" details button for the definition of "health-check-started" under "status-service"
    Then the user "views" the definition details of "health-check-started" under "status-service"
    When the user clicks "show" details button for the definition of "health-check-stopped" under "status-service"
    Then the user "views" the definition details of "health-check-stopped" under "status-service"
    When the user clicks "show" details button for the definition of "application-unhealthy" under "status-service"
    Then the user "views" the definition details of "application-unhealthy" under "status-service"
    When the user clicks "show" details button for the definition of "application-healthy" under "status-service"
    Then the user "views" the definition details of "application-healthy" under "status-service"
