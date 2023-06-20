@notifications
Feature: Notifications


@TEST_CS-1224 @REQ_CS-1183 @regression
  Scenario: As a tenant admin, I can delete a subscriber
    # Autotest user should be already subscribed to application health change notifications. If not, set it to subscribed
    Given a tenant admin user is on status applications page
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views the subscribe checkbox is "checked"
    # Test subscriber deletion
    Given a tenant admin user is on notification subscribers page
    When the user searches subscribers with address as containing "auto.test@gov.ab.ca", email containing "auto.test@gov.ab.ca" and phone number containing "EMPTY"
    Then the user "views" the subscriber of "auto.test@gov.ab.ca", "auto.test@gov.ab.ca", "EMPTY"
    When the user clicks "delete" button of "auto.test@gov.ab.ca", "auto.test@gov.ab.ca" on subscribers page
    Then the user views Delete subscriber modal
    # The validation of delete confirmation modal content is skipped due to the bug of CS-1266
    # And the user views the Delete subscriber confirmation message of "auto.test@gov.ab.ca"
    When the user clicks Delete button on Delete subscriber modal
    Then the user "should not view" the subscriber of "auto.test@gov.ab.ca", "auto.test@gov.ab.ca", "EMPTY"
    When the user selects "Subscriptions" tab for "Notification"
    Then the user "should not view" the subscription of "auto.test@gov.ab.ca", "auto.test@gov.ab.ca" under "Status-Application-Health-Change"
    # Restore the subscription
    Given a tenant admin user is on status applications page
    Then the user views the subscribe checkbox is "unchecked"
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views a callout message of "You are subscribed! You will receive notifications on auto.test@gov.ab.ca for status-application-health-change"
