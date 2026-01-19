@service-status
Feature: Service status

  @TEST_CS-528 @REQ_CS-283 @regression
  Scenario: Test a tenant admin, I can access recommendations about health check, so I can add an appropriate health check to my app
    Given a tenant admin user is on status overview page
    Then the user views the health check guidelines

  # Ignore this test as it crashes the test suite
  # TEST DATA: need 2 applications named "Autotest" and "File Service"
  @TEST_CS-781 @REQ_CS-667 @regression @ignore
  Scenario Outline: As a tenant admin, I can add, edit and delete a notice
    Given a tenant admin user is on status notices page
    When the user clicks Add notice button
    Then the user views Add notice dialog
    When the user enters "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>" on notice dialog
    And the user clicks Save as draft button
    And the user selects "Draft" filter by status radio button
    Then the user "views" the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>"
    When the user clicks "edit" menu for the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>"
    Then the user views Edit notice dialog
    When the user enters "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>" on notice dialog
    And the user clicks Save as draft button
    Then the user "views" the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    # Because notices page refreshs every 30 seconds and the delete step randomly fails, add steps to go off and back to the notices page so that the delete step is done before the next refresh
    When the user selects the "Access" menu item
    And the user selects the "Status" menu item
    And the user selects "Notices" tab for "Status"
    And the user selects "Draft" filter by status radio button
    And the user clicks "delete" menu for the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    Then the user views delete "notice" confirmation modal for "<Description2>"
    When the user clicks Delete button in delete confirmation modal
    And the user selects "Active" filter by status radio button
    Then the user "should not view" the "draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"

    Examples:
      | Description        | Application | Start Date | Start Time | End Date | End Time | Description2            | Application2 | Start Date 2 | Start Time 2 | End Date 2 | End Time 2 |
      | Autotest-NewNotice | Autotest    | Today      | 02:00 pm   | Today    | 11:00 pm | Autotest-ModifiedNotice | File Service | Today        | 10:00 am     | Today      | 02:00 pm   |

  # Ignore this test as it crashes the test suite
  # TEST DATA: "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
  @TEST_CS-782 @REQ_CS-667 @REQ_CS-977 @regression @ignore
  Scenario: As a tenant admin, I can publish and un-publish a notice, and see the notice published event
    Given a tenant admin user is on status notices page
    When the user clicks "Publish" menu for the "Draft" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    And the user selects "Published" filter by status radio button
    Then the user "views" the "Published" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    When the user waits "20" seconds
    And the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "status-service:application-notice-published", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    And the user clicks Show details button for the latest event of "application-notice-published" for "status-service"
    Then the user views event details of "Drafted notice - AUTOMATED TEST ONLY", "Autotest" of application-notice-published for status-service
    When the user selects the "Status" menu item
    And the user selects "Notices" tab for "Status"
    And the user selects "Published" filter by status radio button
    And the user clicks "Unpublish" menu for the "Published" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    And the user selects "Draft" filter by status radio button
    Then the user "views" the "Draft" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"

  # Ignore this test as it crashes the test suite
  # TEST DATA: an application named "Autotest"
  @TEST_CS-783 @REQ_CS-667 @regression @ignore
  Scenario: As a tenant admin, I can add, publish and archive a notice
    Given a tenant admin user is on status notices page
    When the user clicks Add notice button
    Then the user views Add notice dialog
    When the user enters "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm" on notice dialog
    And the user clicks Save as draft button
    And the user selects "Draft" filter by status radio button
    Then the user "views" the "Draft" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    When the user clicks "publish" menu for the "Draft" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    And the user selects "Published" filter by status radio button
    Then the user "views" the "Published" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    And the user should not view "edit menu" for the "Published" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    And the user should not view "delete menu" for the "Published" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    # Because notices page refreshs every 30 seconds and the following step randomly fails, add steps to go off and back to the notices page so that the following step is done before the next refresh
    When the user selects the "Access" menu item
    And the user selects the "Status" menu item
    And the user selects "Notices" tab for "Status"
    And the user selects "Published" filter by status radio button
    When the user clicks "archive" menu for the "Published" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    And the user selects "Archived" filter by status radio button
    Then the user "views" the "Archived" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    And the user should not view "gear icon" for the "Archived" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"

  @TEST_CS-784 @REQ_CS-667 @regression
  Scenario: As a tenant admin, I can filter notices by status
    Given a tenant admin user is on status notices page
    When the user selects "Draft" filter by status radio button
    Then the user views "Draft" notices
    When the user selects "Published" filter by status radio button
    Then the user views "Published" notices
    When the user selects "Archived" filter by status radio button
    Then the user views "Archived" notices
    When the user selects "Active" filter by status radio button
    Then the user views "Active" notices

  @TEST_CS-936 @REQ_CS-907 @regression
  Scenario: As a tenant admin, I can subscribe to health check notification type
    Given a tenant admin user is on status applications page
    # Autotest user should be already subscribed to application health change notifications. If not, set it to subscribed
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views the subscribe checkbox is "checked"
    # Unsubscribe application health change notifications
    When the user "unselects" the subscribe checkbox for health check notification type
    Then the user views a notification message of "You are unsubscribed! You will no longer receive notifications for status-application-health-change"
    When the user selects the "Dashboard" menu item
    And the user selects the "Status" menu item
    And the user selects "Applications" tab for "Status"
    Then the user views the subscribe checkbox is "unchecked"
    # Subscribe application health change notifications
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views a notification message of "You are subscribed! You will receive notifications on adsp1.t@gov.ab.ca for status-application-health-change"
    When the user selects the "Dashboard" menu item
    And the user selects the "Status" menu item
    And the user selects "Applications" tab for "Status"
    Then the user views the subscribe checkbox is "checked"

  # CS-4618 Cannot save a notice changed from all applications to a specific type
  @TEST_CS-835 @REQ_CS-792 @regression @ignore
  Scenario Outline: As a tenant admin, I can add, edit, publish, unpublish and delete a tenant level notice
    Given a tenant admin user is on status notices page
    When the user clicks Add notice button
    # Add a notice for the tenant
    Then the user views Add notice dialog
    When the user enters "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>" on notice dialog
    And the user clicks Save as draft button
    And the user selects "Draft" filter by status radio button
    Then the user "views" the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>"
    # Edit the notice from All to a service specific
    When the user clicks "edit" menu for the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>"
    Then the user views Edit notice dialog
    When the user enters "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>" on notice dialog
    And the user clicks Save as draft button
    Then the user "views" the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    # Change the notice back to All
    # Because notices page refreshs every 30 seconds and the edit step randomly fails, add steps to go off and back to the notices page so that the edit step is done before the next refresh
    When the user selects the "Access" menu item
    And the user selects the "Status" menu item
    And the user selects "Notices" tab for "Status"
    And the user selects "Draft" filter by status radio button
    When the user clicks "edit" menu for the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    Then the user views Edit notice dialog
    When the user enters "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>" on notice dialog
    And the user clicks Save as draft button
    Then the user "views" the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    # Publish the notice
    # Because notices page refreshs every 30 seconds and the following step randomly fails, add steps to go off and back to the notices page so that the following step is done before the next refresh
    When the user selects the "Access" menu item
    And the user selects the "Status" menu item
    And the user selects "Notices" tab for "Status"
    And the user selects "Draft" filter by status radio button
    When the user clicks "publish" menu for the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    And the user selects "Published" filter by status radio button
    Then the user "views" the "Published" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    # Unpublish the notice
    When the user clicks "unpublish" menu for the "Published" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    And the user selects "Draft" filter by status radio button
    Then the user "views" the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    # Delete the notice
    And the user clicks "delete" menu for the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", " <Start Time 2>", "<End Date 2>", "<End Time 2>"
    Then the user views delete "notice" confirmation modal for "<Description2>"
    When the user clicks Delete button in delete confirmation modal
    And the user selects "Active" filter by status radio button
    Then the user "should not view" the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"

    Examples:
      | Description           | Application | Start Date | Start Time | End Date | End Time | Description2               | Application2 | Start Date 2 | Start Time 2 | End Date 2 | End Time 2 |
      | Autotest-NewAllNotice | All         | Today      | 12:00 am   | Today    | 12:00 am | Autotest-ModifiedAllNotice | Autotest     | Today        | 10:00 am     | Today      | 02:00 pm   |

  @TEST_CS-339 @REQ_CS-169 @regression @prod
  Scenario: As a tenant admin, I can add/edit/delete an application
    Given a tenant admin user is on status applications page
    When the user clicks Add application button
    Then the user views Add application modal
    When the user enters "Autotest-addApp" as name and "Autotest-addApp" as description and "https://tenant-management-webapp-adsp-dev.apps.aro.gov.ab.ca/" as endpoint
    And the user clicks Save application button
    Then the user "views" "Autotest-addApp" in the application list
    When the user clicks "Edit" button for "Autotest-addApp"
    Then the user views "Autotest-addApp" as name and "Autotest-addApp" as description in the modal fields
    When the user enters "Autotest-addApp Edited" as name and "Autotest-addApp Edited" as description fields
    And the user clicks Save application button
    Then the user "views" "Autotest-addApp Edited" in the application list
    When the user clicks "Delete" button for "Autotest-addApp Edited"
    Then the user views delete "application" confirmation modal for "Autotest-addApp Edited"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" "Autotest-addApp Edited" in the application list

  # CS-3933 Application status goes back to original value after a change
  @TEST_CS-996 @REQ_CS-962 @regression @ignore
  Scenario: As a tenant admin, I can trigger application status change event and see the event in the event log
    # Create an application for testing application status chagne events
    Given a tenant admin user is on status applications page
    When the user clicks Add application button
    Then the user views Add application modal
    When the user enters "autotest-app-status-change-event" as name and "autotest-app-status-change-event-desc" as description and "https://localhost" as endpoint
    And the user clicks Save application button
    Then the user "views" "autotest-app-status-change-event" in the application list
    # Change status from empty to outage and verify the event
    When the user clicks Change status button for "autotest-app-status-change-event"
    Then the user views Manual status change modal
    When the user selects "Outage" and clicks Save button
    Then the user views the "Outage" status for "autotest-app-status-change-event"
    When the user waits "20" seconds
    And the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "status-service:application-status-changed", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    And the user clicks Show details button for the latest event of "application-status-changed" for "status-service"
    Then the user views the event details with status changing from "Operational" to "Outage"
    # Change status from outage to maintenance and verify the event
    When the user selects the "Status" menu item
    And the user selects "Applications" tab for "Status"
    And the user clicks Change status button for "autotest-app-status-change-event"
    Then the user views Manual status change modal
    When the user selects "Maintenance" and clicks Save button
    Then the user views the "Maintenance" status for "autotest-app-status-change-event"
    When the user waits "20" seconds
    And the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "status-service:application-status-changed", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    When the user clicks Show details button for the latest event of "application-status-changed" for "status-service"
    Then the user views the event details with status changing from "Outage" to "Maintenance"
    # Remove the application
    When the user selects the "Status" menu item
    And the user selects "Applications" tab for "Status"
    Then the user "views" "autotest-app-status-change-event" in the application list
    When the user clicks "Delete" button for "autotest-app-status-change-event"
    Then the user views delete "application" confirmation modal for "autotest-app-status-change-event"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" "autotest-app-status-change-event" in the application list

  # TEST DATA: existing subscription of "autotest-DO-NOT-DELETE", "adsp5.t@gov.ab.ca" under "Application status update"
  @TEST_CS-1282 @REQ_CS-905 @regression
  Scenario: As an interested stakeholder, I can verify status notifications for a tenant, so that I know about service availability.
    Given a tenant admin user is on notification subscriptions page
    When the user types "adsp5.t@gov.ab.ca" in Search subscriber email field
    And the user clicks Search button on notifications page
    Then the user "views" the subscription of "autotest-DO-NOT-DELETE", "adsp5.t@gov.ab.ca" under "Application status update"
    Given a tenant admin user is on status applications page
    Then the user "views" "autotest-DO-NOT-DELETE" in the application list
    And the user views current status for "autotest-DO-NOT-DELETE"
    When the user clicks Change status button for "autotest-DO-NOT-DELETE"
    And the user changes status to the first unused status
    When the user clicks Save button in Manual status change modal
    Then the user views the status of "autotest-DO-NOT-DELETE" changed to the first unused status
    When the user waits "20" seconds
    And the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "notification-service:notification-sent", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    Then the user views the events matching the search filter of "notification-service:notification-sent"
    And the user views the event details of "autotest-DO-NOT-DELETE" application status changed from "{original status}" to "{new status}" for subscriber of "adsp5.t@gov.ab.ca"

  @TEST_CS-1287 @REQ_CS-1261 @REQ_CS-1262 @regression
  Scenario: As a tenant admin, I can modify tenant support email for status page so that users know where to report the issues.
    Given a tenant admin user is on status overview page
    When the user clicks Edit button for contact information
    Then the user views Edit contact information modal on the status overview page
    When the user enters "autotest-status-admin@gov.ab.ca" in Edit contact information modal
    And the user clicks Save button on contact information modal
    Then the user views "autotest-status-admin@gov.ab.ca" as the email of contact information
    # Visiting public status page
    Then the user should be able to view "autotest-status-admin@gov.ab.ca" as support email in the status app for "Autotest" tenant
    Given a tenant admin user is on status overview page
    When the user clicks Edit button for contact information
    And the user enters "adsp1.t@gov.ab.ca" in Edit contact information modal
    And the user clicks Save button on contact information modal
    Then the user views "adsp1.t@gov.ab.ca" as the email of contact information

  @TEST_CS-333 @REQ_CS-163 @regression @prod
  Scenario: As a tenant admin, I can update the status of my service/app, so it is available to the public
    Given a tenant admin user is on status applications page
    Then the user views current status for "autotest-DO-NOT-DELETE"
    When the user clicks Change status button for "autotest-DO-NOT-DELETE"
    And the user changes status to the first unused status
    When the user clicks Save button in Manual status change modal
    Then the user views the status of "autotest-DO-NOT-DELETE" changed to the first unused status
    Given a user is on the public service status page for "autotest"
    Then the user views the status of "autotest-DO-NOT-DELETE" being the first unused status
    And the user views the timestamp of "autotest-DO-NOT-DELETE" being updated

  # Copy link icon fails accessibility test for now. Ignore the test for now
  @accessibility @regression @ignore
  Scenario: As a service admin, I can use status pages without any critical or serious accessibility issues
    Given a tenant admin user is on status overview page
    Then no critical or serious accessibility issues on "status overview page"
    When the user clicks Edit button for contact information
    Then the user views Edit contact information modal on the status overview page
    And no critical or serious accessibility issues for "edit status contact information modal" on "status overview page"
    And the user clicks Cancel button on contact information modal
    When the user clicks Add application button
    Then the user views Add application modal
    And no critical or serious accessibility issues for "add application modal" on "status overview page"
    When the user clicks Cancel application button
    Then no critical or serious accessibility issues on "status applications page"
    When the user selects "Notices" tab for "Status"
    Then no critical or serious accessibility issues on "status notices page"
  ## CS-1863 is pending for fix
  # When the user clicks Add notice button
  # Then the user views Add notice dialog
  # And no critical or serious accessibility issues for "add notice modal" on "status notices page"
  # When the user clicks Cancel button in notice modal

  @TEST_CS-2249 @REQ_CS-2058 @regression @prod
  Scenario: As a tenant admin, I can set a status application to be monitoring only, so it does not appear on the public status page
    Given a tenant admin user is on status applications page
    # Set monitor only for an application
    When the user "selects" Monitor only checkbox for "autotest-testMonitoring"
    And the user selects "Notices" tab for "Status"
    And the user clicks Add notice button
    Then the user "should not view" "autotest-testMonitoring" in applications dropdown in Add notice model
    # Visiting public status page to verify monitor only application doesn't show up
    Given a user is on the public service status page for "autotest"
    Then the user "should not view" "autotest-testMonitoring" application in the status app for "Autotest" tenant
    # Restore the application
    Given a tenant admin user is on status applications page
    When the user "unselects" Monitor only checkbox for "autotest-testMonitoring"
    And the user selects "Notices" tab for "Status"
    And the user clicks Add notice button
    Then the user "views" "autotest-testMonitoring" in applications dropdown in Add notice model
    # Visiting public status page to verify application shows up again
    Given a user is on the public service status page for "autotest"
    Then the user "views" "autotest-testMonitoring" application in the status app for "Autotest" tenant