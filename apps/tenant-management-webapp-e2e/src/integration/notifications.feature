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
