@notifications
Feature: Notifications

  @TEST_CS-945 @REQ_CS-641 @REQ_CS-788 @REQ_CS-979 @regression
  Scenario: As a service owner, I can add/edit/delete Notification Types
    Given a service owner user is on notification overview page
    When the user clicks Add notification type button
    Then the user views Add notification modal
    When the user enters "autotest-addNotificationType", "autotest notification desc", "Anyone (Anonymous)"
    And the user clicks save button
    Then the user "views" the notification type card of "autotest-addNotificationType", "autotest notification desc", "Anyone (Anonymous)", "yes"
    # Verify there is Add notification button on the notification type page as well after saving a new notification type
    And the user views Add notification type button on Notification types page
    When the user clicks "edit" button for the notification type card of "autotest-addNotificationType"
    Then the user views Edit notification type modal for "autotest-addNotificationType"
    When the user enters "autotest-editNotificationType", "Edited notification type desc", "auto-test-role1, file-service-admin"
    And the user clicks save button
    Then the user "views" the notification type card of "autotest-editNotificationType", "Edited notification type desc", "auto-test-role1, file-service-admin", "no"
    When the user clicks "delete" button for the notification type card of "autotest-editNotificationType"
    Then the user views delete confirmation modal for "autotest-editNotificationType"
    When the user clicks Confirm button on delete confirmation modal
    Then the user "should not view" the notification type card of "autotest-editNotificationType", "Edited notification type desc", "auto-test-role1, file-service-admin", "no"

  # TEST DATA: a precreated notification type named "autotest-notificationType" with an event other than "tenant-service:tenant-created"
  @TEST_CS-949 @REQ_CS-277 @regression
  Scenario: As a service owner, I can add and delete events of a notification type
    Given a service owner user is on notification types page
    # Add an event and verify the event can't be added again
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    When the user selects "tenant-service:tenant-created" in the event dropdown
    And the user clicks Next button on Select an event page
    Then the user views Add an email template page
    When the user enters "autotest subject" as subject and "autotest body" as body
    And the user clicks Add button in Add an email template page
    Then the user "views" the event of "tenant-service:tenant-created" in "autotest-notificationType"
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    When the user cannot select "tenant-service:tenant-created" in the event dropdown
    And the user clicks Cancel button in Select an event modal
    # Delete an event
    When the user clicks "delete" button for "tenant-service:tenant-created" in "autotest-notificationType"
    Then the user views Remove event modal for "tenant-service:tenant-created"
    When the user clicks Confirm button in Remove event modal
    Then the user "should not view" the event of "tenant-service:tenant-created" in "autotest-notificationType"

  @TEST_CS-976 @REQ_CS-906 @regression
  Scenario: Test the registration of notification type in status service for application health change
    Given a service owner user is on notification types page
    # Verify the type and its events
    Then the user "views" the notification type card of "status-application-health-change"
    And the user "views" the event of "status-service:health-check-started" in "status-application-health-change"
    And the user "views" the event of "status-service:health-check-stopped" in "status-application-health-change"
    And the user "views" the event of "status-service:application-unhealthy" in "status-application-health-change"
    And the user "views" the event of "status-service:application-healthy" in "status-application-health-change"
    # Verify the events' email icons and preview links, and no edit buttons
    And the user "views" "email template indicator" for "status-service:health-check-started" in "status-application-health-change"
    And the user "views" "Preview link" for "status-service:health-check-started" in "status-application-health-change"
    And the user "should not view" "Edit button" for "status-service:health-check-started" in "status-application-health-change"
    And the user "views" "email template indicator" for "status-service:health-check-stopped" in "status-application-health-change"
    And the user "views" "Preview link" for "status-service:health-check-stopped" in "status-application-health-change"
    And the user "should not view" "Edit button" for "status-service:health-check-stopped" in "status-application-health-change"
    And the user "views" "email template indicator" for "status-service:application-unhealthy" in "status-application-health-change"
    And the user "views" "Preview link" for "status-service:application-unhealthy" in "status-application-health-change"
    And the user "should not view" "Edit button" for "status-service:application-unhealthy" in "status-application-health-change"
    And the user "views" "email template indicator" for "status-service:application-healthy" in "status-application-health-change"
    And the user "views" "Preview link" for "status-service:application-healthy" in "status-application-health-change"
    And the user "should not view" "Edit button" for "status-service:application-healthy" in "status-application-health-change"
    # Verify email template is read-only (pick one event)
    When the user clicks Preview button on "status-service:health-check-started" in "status-application-health-change"
    Then the user views Preview an email template modal
    # Future work: need in-depth research on test automation with Monaco-editor before we can automate test steps.
    # When the user attempts to edit the template
    # Then the user gets "Cannot edit in read-only editor"
    When the user clicks Close button in Preview an email template modal
    Then Preview an email template modal is closed
    # Verify the event is still there (had a bug of the event disappearing after preview)
    And the user "views" the event of "status-service:health-check-started" in "status-application-health-change"

  @TEST_CS-1081 @REQ_CS-1029 @TEST_CS-1002 @REQ_CS-1027 @regression
  Scenario: Test As a tenant admin, I can delete a subscription
    # Autotest user should be already subscribed to application health change notifications. If not, set it to subscribed
    Given a tenant admin user is on status applications page
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views the subscribe checkbox is "checked"
    # Test subscription deletion
    Given a tenant admin user is on notification subscriptions page
    When the user types "Auto Test" in Search subuscriber address as field and "auto.test@gov.ab.ca" in Search subscriber email field
    And the user clicks Search button on notifications page
    Then the user "views" the subscription of "Auto Test", "auto.test@gov.ab.ca" under "Status-Application-Health-Change"
    When the user clicks delete button of "Auto Test", "auto.test@gov.ab.ca" under "Status-Application-Health-Change"
    Then the user views Delete subscription modal
    And the user views the Delete subscription confirmation message of "auto.test@gov.ab.ca"
    When the user clicks Confirm button on Delete subscription modal
    Then the user views a callout message of "You are unsubscribed! You will no longer receive notifications on auto.test@gov.ab.ca for status-application-health-change"
    Then the user "should not view" the subscription of "Auto Test", "auto.test@gov.ab.ca" under "Status-Application-Health-Change"
    # Restore the subscription
    Given a tenant admin user is on status applications page
    Then the user views the subscribe checkbox is "unchecked"
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views a callout message of "You are subscribed! You will receive notifications on auto.test@gov.ab.ca for status-application-health-change"
