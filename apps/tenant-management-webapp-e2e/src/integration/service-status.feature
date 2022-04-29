@service-status
Feature: Service status

  @TEST_CS-528 @REQ_CS-283 @regression
  Scenario: Test As a developer, I can access recommendations about health check, so I can add an appropriate health check to my app
    Given a service owner user is on service status page
    Then the user views the health check guidelines

  # TEST DATA: need 2 applications named "Autotest" and "File Service"
  @TEST_CS-781 @REQ_CS-667 @regression
  Scenario Outline: As a service owner, I can add, edit and delete a notice
    Given a service owner user is on status notices page
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
    When the user clicks "delete" menu for the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    Then the user views delete "notice" confirmation modal for "<Description2>"
    When the user clicks Delete button in delete confirmation modal
    And the user selects "Active" filter by status radio button
    Then the user "should not view" the "draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"

    Examples:
      | Description        | Application | Start Date | Start Time | End Date | End Time | Description2            | Application2 | Start Date 2 | Start Time 2 | End Date 2 | End Time 2 |
      | Autotest-NewNotice | Autotest    | Today      | 02:00 pm   | Today    | 11:00 pm | Autotest-ModifiedNotice | File Service | Today        | 10:00 am     | Today      | 02:00 pm   |

  # TEST DATA: "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
  @TEST_CS-782 @REQ_CS-667 @regression
  Scenario: As a service owner, I can publish and un-publish a notice
    Given a service owner user is on status notices page
    When the user clicks "publish" menu for the "Draft" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    And the user selects "Published" filter by status radio button
    Then the user "views" the "Published" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    When the user clicks "unpublish" menu for the "Published" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    And the user selects "Draft" filter by status radio button
    Then the user "views" the "Draft" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"

  # TEST DATA: an application named "Autotest"
  @TEST_CS-783 @REQ_CS-667 @regression
  Scenario: As a service owner, I can add, publish and archive a notice
    Given a service owner user is on status notices page
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
    When the user clicks "archive" menu for the "Published" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    And the user selects "Archived" filter by status radio button
    Then the user "views" the "Archived" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    And the user should not view "gear icon" for the "Archived" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"

  @TEST_CS-784 @REQ_CS-667 @regression
  Scenario: As a service owner, I can filter notices by status
    Given a service owner user is on status notices page
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
    Then the user views a callout message of "You are unsubscribed! You will no longer receive notifications for status-application-health-change"
    When the user selects the "Dashboard" menu item
    And the user selects the "Status" menu item
    And the user selects "Applications" tab for "Status"
    Then the user views the subscribe checkbox is "unchecked"
    # Subscribe application health change notifications
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views a callout message of "You are subscribed! You will receive notifications on auto.test@gov.ab.ca for status-application-health-change"
    When the user selects the "Dashboard" menu item
    And the user selects the "Status" menu item
    And the user selects "Applications" tab for "Status"
    Then the user views the subscribe checkbox is "checked"

  @TEST_CS-835 @REQ_CS-792 @regression
  Scenario Outline: As a service owner, I can add, edit, publish, unpublish and delete a tenant level notice
    Given a service owner user is on status notices page
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
    When the user clicks "edit" menu for the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    Then the user views Edit notice dialog
    When the user enters "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>" on notice dialog
    And the user clicks Save as draft button
    Then the user "views" the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    # Publish the notice
    When the user clicks "publish" menu for the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    And the user selects "Published" filter by status radio button
    Then the user "views" the "Published" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    # Unpublish the notice
    When the user clicks "unpublish" menu for the "Published" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    And the user selects "Draft" filter by status radio button
    Then the user "views" the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    # Delete the notice
    When the user clicks "delete" menu for the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", " <Start Time 2>", "<End Date 2>", "<End Time 2>"
    Then the user views delete "notice" confirmation modal for "<Description2>"
    When the user clicks Delete button in delete confirmation modal
    And the user selects "Active" filter by status radio button
    Then the user "should not view" the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"

    Examples:
      | Description           | Application | Start Date | Start Time | End Date | End Time | Description2               | Application2 | Start Date 2 | Start Time 2 | End Date 2 | End Time 2 |
      | Autotest-NewAllNotice | All         | Today      | 12:00 am   | Today    | 12:00 am | Autotest-ModifiedAllNotice | Autotest     | Today        | 10:00 am     | Today      | 02:00 pm   |

  @TEST_CS-339 @REQ_CS-169 @regression
  Scenario: As a tenant admin user, I can add/edit/delete an application
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

  @TEST_CS-996 @regression
  Scenario: As a tenant admin, I can trigger application status change event and see the event in the event log
    # Create an application for testing application status chagne events
    Given a tenant admin user is on status applications page
    When the user clicks Add application button
    Then the user views Add application modal
    When the user enters "autotest-status-change-event" as name and "autotest-status-change-event-desc" as description and "https://localhost" as endpoint
    And the user clicks Save application button
    Then the user "views" "autotest-status-change-event" in the application list
    # Change status from empty to outage and verify the event
    When the user clicks Change status button for "autotest-status-change-event"
    Then the user views Manual status change modal
    When the user selects "Outage" and clicks Save button
    Then the user views the "Outage" status for "autotest-status-change-event"
    When the user waits "20" seconds
    And the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "status-service:application-status-changed", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    And the user clicks Show details button for the latest event of "application-status-changed" for "status-service"
    Then the user views the event details with status changing from "Empty" to "Outage"
    # Change status from outage to maintenance and verify the event
    When the user selects the "Status" menu item
    And the user selects "Applications" tab for "Status"
    And the user clicks Change status button for "autotest-status-change-event"
    Then the user views Manual status change modal
    When the user selects "Maintenance" and clicks Save button
    Then the user views the "Maintenance" status for "autotest-status-change-event"
    When the user waits "20" seconds
    And the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "status-service:application-status-changed", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    When the user clicks Show details button for the latest event of "application-status-changed" for "status-service"
    Then the user views the event details with status changing from "Outage" to "Maintenance"
    # Remove the application
    When the user selects the "Status" menu item
    And the user selects "Applications" tab for "Status"
    Then the user "views" "autotest-status-change-event" in the application list
    When the user clicks "Delete" button for "autotest-status-change-event"
    Then the user views delete "application" confirmation modal for "autotest-status-change-event"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" "autotest-status-change-event" in the application list

  @TEST_CS-1282 @REQ_CS-905 @regression
  Scenario: As an interested stakeholder, I can verify status notifications for a tenant, so that I know about service availability.
    Given a tenant admin user is on notification subscriptions page
    When the user types "auto.test@gov.ab.ca" in Search subscriber email field
    And the user clicks Search button on notifications page
    Then the user "views" the subscription of "Auto Test", "auto.test@gov.ab.ca" under "Application status update"
    Given a tenant admin user is on status applications page
    Then the user "views" "Autotest" in the application list
    And the user views current status for "Autotest"
    When the user clicks Change status button for "Autotest"
    Then the user changes status to the first unused status
    When the user clicks Save button in Manual status change modal
    Then the user views the status of "Autotest" changed to the first unused status
    When the user waits "20" seconds
    And the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "notification-service:notification-sent", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    Then the user views the events matching the search filter of "notification-service:notification-sent"
    And the user should find the event details of "Auto Test" application status changed from "{original status}" to "{new status}" for subscriber of "auto.test@gov.ab.ca"
