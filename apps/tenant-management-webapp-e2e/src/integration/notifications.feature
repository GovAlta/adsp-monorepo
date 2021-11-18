@notifications
Feature: Notifications

  @TEST_CS-945 @REQ_CS-641 @TEST_CS-936 @REQ_CS-788 @regression
  Scenario: As a service owner, I can add/edit/delete Notification Types
    Given a service owner user is on notification overview page
    And the user clicks Add notification type button
    Then the user views Add notification modal
    When the user enters "autotest-addNotificationType", ""
    And the user clicks save button
    Then the user "views" the notification type card of "autotest-addNotificationType", ""
    And the user views Add notification type button
    When the user clicks "edit" button of the notification type card of "autotest-addNotificationType", ""
    Then the user views Edit notification type modal
    When the user enters "autotest-editNotificationType", "Edit notification type"
    And the user clicks save button
    Then the user "views" the notification type card of "autotest-editNotificationType", "Edit notification type"
    When the user clicks "delete" button of the notification type card of "autotest-editNotificationType", "Edit notification type"
    Then the user views delete confirmation modal for "autotest-editNotificationType"
    When the user clicks Ok button
    Then the user "should not view" the notification type card of the notification card of "autotest-editNotificationType", "Edit notification type"