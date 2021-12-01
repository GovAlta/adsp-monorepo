@notifications
Feature: Notifications

  @TEST_CS-945 @REQ_CS-641 @REQ_CS-788 @REQ_CS-979 @regression
  Scenario: As a service owner, I can add/edit/delete Notification Types
    Given a service owner user is on notification overview page
    And the user clicks Add notification type button
    Then the user views Add notification modal
    When the user enters "autotest-addNotificationType", "", , "Anyone (Anonymous)"
    And the user clicks save button
    Then the user "views" the notification type card of "autotest-addNotificationType", "", "", "yes"
    And the user views Add notification type button
    When the user clicks "edit" button of the notification type card of "autotest-addNotificationType", "", "", "yes"
    Then the user views Edit notification type modal
    When the user enters "autotest-editNotificationType", "Edit notification type", "auto-test-role1, file-service-admin"
    And the user clicks save button
    Then the user "views" the notification type card of "autotest-editNotificationType", "Edit notification type", "auto-test-role1, file-service-admin", "no"
    When the user clicks "delete" button of the notification type card of "autotest-editNotificationType", "Edit notification type", "auto-test-role1, file-service-admin", "no"
    Then the user views delete confirmation modal for "autotest-editNotificationType"
    When the user clicks Ok button
    Then the user "should not view" the notification type card of the notification card of "autotest-editNotificationType", "Edit notification type", "auto-test-role1, file-service-admin", "no"