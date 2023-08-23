Feature: Events

  @regression
  Scenario: As a tenant admin, I can see events overview
    Given a tenant admin user is on tenant admin page
    When the user selects the "Event" menu item
    Then the user views events overview page

  @regression
  Scenario: As a tenant admin, I can see details of event definitions
    Given a tenant admin user is on tenant admin page
    When the user selects the "Event" menu item
    And the user selects "Definitions" tab for "Event"
    Then the user views an event definition of "tenant-created" under "tenant-service"
    When the user clicks "show" details button for the definition of "tenant-created" under "tenant-service"
    Then the user "views" the definition details of "tenant-created" under "tenant-service"
    When the user clicks "hide" details button for the definition of "tenant-created" under "tenant-service"
    Then the user "should not view" the definition details of "tenant-created" under "tenant-service"

  @regression @ignore
  # Ignore this test until CS-1134 is fixed
  Scenario: As a tenant admin, I can see event service API docs
    Given a tenant admin user is on tenant admin page
    When the user selects the "Event" menu item
    Then the user views the link of API docs for "Event service"
    When the user goes to the web link of the API docs
    Then the user views "Event service" API documentation

  # Test on Monaco editor for payload schema isn't included and will need to be tested in future
  @TEST_CS-735 @REQ_CS-250 @regression
  Scenario: As a tenant admin, I can see add, edit and delete an event definition
    Given a tenant admin user is on tenant admin page
    When the user selects the "Event" menu item
    And the user selects "Definitions" tab for "Event"
    And the user clicks Add definition button
    Then the user views Add definition dialog
    When the user enters "Autotest" in Namespace, "autotest-addEditDeleteEvent" in Name, "autotest event desc" in Description
    And the user clicks Save button on Definition modal
    Then the user "views" an event definition of "autotest-addEditDeleteEvent" and "autotest event desc" under "Autotest"
    When the user clicks "Edit" button for the definition of "autotest-addEditDeleteEvent" and "autotest event desc" under "Autotest"
    Then the user views Edit definition dialog
    When the user enters "autotest event desc2" in Description
    And the user clicks Save button on Definition modal
    Then the user "views" an event definition of "autotest-addEditDeleteEvent" and "autotest event desc2" under "Autotest"
    When the user clicks "Delete" button for the definition of "autotest-addEditDeleteEvent" and "autotest event desc2" under "Autotest"
    Then the user views delete "event definition" confirmation modal for "autotest-addEditDeleteEvent"
    And the user clicks Delete button in delete confirmation modal
    Then the user "should not view" an event definition of "autotest-addEditDeleteEvent" and "autotest event desc2" under "Autotest"

  @accessibility @regression
  Scenario: As a tenant admin, I can use event pages without any critical or serious accessibility issues
    Given a tenant admin user is on tenant admin page
    When the user selects the "Event" menu item
    Then no critical or serious accessibility issues on "event overview page"
    When the user selects "Definitions" tab for "Event"
    Then no critical or serious accessibility issues on "event definitions page"
    # Accessibility test on Add definition dialog causes Cypress to crash. Need further research to avoid Cypress crash before running this test again.
    # When the user clicks Add definition button
    # Then the user views Add definition dialog
    # And no critical or serious accessibility issues for "event definition modal" on "event definitions page"
    # When the user clicks Cancel button on Definition modal
    And the user selects "Streams" tab for "Event"
    Then no critical or serious accessibility issues on "event streams page"
    When the user selects "Test stream" tab for "Event"
    Then no critical or serious accessibility issues on "event test stream page"

  @TEST_CS-739 @REQ_CS-250 @regression
  Scenario Outline: As a tenant admin, I cannot add event definitions with names or namespaces contains ":"
    Given a service owner user is on event definitions page
    When the user clicks Add definition button
    And the user enters "<Namespace>" in Namespace, "<Name>" in Name, "<Description>" in Description
    Then the user views the "<Error Message>" for "<Error Field>"
    Then the user views disabled Save button on Definition modal
    When the user clicks Cancel button on Definition modal
    Then the user exits the add definition dialog
    Examples:
      | Namespace           | Name           | Description    | Error Message                               | Error Field |
      | autotest-name:space | autotest-name  | auto-test-desc | Allowed characters are: a-z, A-Z, 0-9, -, _ | Namespace   |
      | autotest-namespace  | autotest-na:me | auto-test-desc | Allowed characters are: a-z, A-Z, 0-9, -, _ | Name        |

  @TEST_CS-740 @REQ_CS-250 @regression
  Scenario: As a tenant admin, I cannot add/modify/delete event definitions within platform service namespaces
    Given a service owner user is on event definitions page
    Then the user only views show button for event definitions of "tenant-service, configuration-service, notification-service, value-service, file-service"
    When the user clicks Add definition button
    And the user enters "tenant-service" in Namespace, "test" in Name, "test" in Description
    Then the user views the "tenant-service is forbidden" for "Namespace"
    Then the user views disabled Save button on Definition modal
    When the user clicks Cancel button on Definition modal
    Then the user exits the add definition dialog

  @TEST_CS-930 @REQ_CS-897 @regression
  Scenario: As a tenant admin, I can see health check event definitions for the status service, so that I know what events are available.
    Given a service owner user is on event definitions page
    Then the user "views" an event definition of "health-check-started" and "Signalled when an application health check is started." under "status-service"
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

  @TEST_CS-1430 @REQ_CS-1203 @regression
  Scenario: As a tenant admin, I can view stream configuration for events, so that I know they are available via push service
    Given a tenant admin user is on tenant admin page
    When the user selects the "Event" menu item
    And the user selects "Streams" tab for "Event"
    Then the user views Core streams section
    When the user clicks eye icon of "PDF generation updates" under Core streams
    Then the user views the details of "PDF generation updates" under Core streams

  @TEST_CS-1480 @REQ_CS-1352 @regression
  Scenario: As a tenant admin, I can add, edit and delete an event stream
    Given a tenant admin user is on event streams page
    # Add a stream
    When the user clicks Add stream button
    Then the user views Add stream modal
    When the user enters "autotest-addEditDelete-stream", "autotest-stream-desc", "status-service:application-healthy, file-service:file-deleted", "public" in Add stream modal
    And the user clicks Save button in Stream modal
    Then the user "views" the stream of "autotest-addEditDelete-stream", "Public"
    When the user clicks "Eye" button for the stream of "autotest-addEditDelete-stream"
    Then the user views the stream details of "autotest-addEditDelete-stream", "autotest-stream-desc", "status-service:application-healthy, file-service:file-deleted", "public"
    And the user clicks "Eye-Off" button for the stream of "autotest-addEditDelete-stream"
    # Edit a stream
    When the user clicks "Edit" button for the stream of "autotest-addEditDelete-stream"
    Then the user views Edit stream modal
    When the user removes event chips of "status-service:application-healthy" in Edit stream modal
    And the user enters "autotest-stream-desc2", "n/a", "auto-test-role3, beta-tester" in Edit stream modal
    And the user clicks Save button in Stream modal
    Then the user "views" the stream of "autotest-addEditDelete-stream", "auto-test-role3, beta-tester"
    When the user clicks "Eye" button for the stream of "autotest-addEditDelete-stream"
    Then the user views the stream details of "autotest-addEditDelete-stream", "autotest-stream-desc2", "file-service:file-deleted", "auto-test-role3, beta-tester"
    # Delete a stream
    When the user clicks "Delete" button for the stream of "autotest-addEditDelete-stream"
    Then the user views delete "stream" confirmation modal for "autotest-addEditDelete-stream"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the stream of "autotest-addEditDelete-stream"

  @TEST_CS-1596 @REQ_CS-1549 @regression
  Scenario: As a tenant admin, I can select client roles for event stream subscriber roles, so I can allow users with certain client roles to subscribe
    Given a tenant admin user is on event streams page
    # Add a new stream with client roles
    When the user clicks Add stream button
    Then the user views Add stream modal
    When the user enters "autotest-testclientroles", "autotest desc", "file-service:file-deleted", "urn:ads:autotest:my-service:my-role1, urn:ads:platform:file-service:file-service-admin" in Add stream modal
    And the user clicks Save button in Stream modal
    Then the user "views" the stream of "autotest-testclientroles", "urn:ads:autotest:my-service:my-role1, urn:ads:platform:file-service:file-service-admin"
    # Modify the stream with public role
    When the user clicks "Edit" button for the stream of "autotest-testclientroles"
    Then the user views Edit stream modal
    When the user "selects" Make stream public checkbox in Stream modal
    And the user clicks Save button in Stream modal
    Then the user "views" the stream of "autotest-testclientroles", "Public"
    # Modify the stream to be non-public role. Un-selecting the public checkbox shows the previous selected roles
    When the user clicks "Edit" button for the stream of "autotest-testclientroles"
    Then the user views Edit stream modal
    When the user "un-selects" Make stream public checkbox in Stream modal
    And the user clicks Save button in Stream modal
    Then the user "views" the stream of "autotest-testclientroles", "urn:ads:autotest:my-service:my-role1, urn:ads:platform:file-service:file-service-admin"
    # Delete the stream
    When the user clicks "Delete" button for the stream of "autotest-testclientroles"
    Then the user views delete "stream" confirmation modal for "autotest-testclientroles"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the stream of "autotest-testclientroles"