@notifications
Feature: Notifications

  @TEST_CS-945 @REQ_CS-641 @REQ_CS-788 @REQ_CS-979 @REQ_CS-1068 @regression
  Scenario: As a tenant admin, I can add/edit/delete Notification Types
    Given a tenant admin user is on notification overview page
    When the user clicks Add notification type button
    Then the user views Add notification type modal
    When the user enters "autotest-addNotificationType", "autotest notification desc", "public", "no", "no", "yes" on notification type modal
    And the user clicks Save button in notification type modal
    Then the user "views" the notification type card of "autotest-addNotificationType", "autotest notification desc", "public", "yes", "yes"
    # Verify there is Add notification button on the notification type page as well after saving a new notification type
    And the user views Add notification type button on Notification types page
    When the user clicks "edit" button for the notification type card of "autotest-addNotificationType"
    Then the user views Edit notification type modal for "autotest-addNotificationType"
    When the user enters "autotest-editNotificationType", "Edited notification type desc", "auto-test-role1", "no", "no", "no" on notification type modal
    And the user clicks Save button in notification type modal
    Then the user "views" the notification type card of "autotest-editNotificationType", "Edited notification type desc", "auto-test-role1", "no", "no"
    When the user clicks "delete" button for the notification type card of "autotest-editNotificationType"
    Then the user views delete "notification type" confirmation modal for "autotest-editNotificationType"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the notification type card of "autotest-editNotificationType", "Edited notification type desc", "auto-test-role1", "no", "no"

  # CS-4536 Monaco editor bug to be resolved before enabling the test again
  # TEST DATA: a precreated notification type named "autotest-notificationType"
  @TEST_CS-949 @REQ_CS-277 @regression @ignore
  Scenario: As a tenant admin, I can add and delete events of a notification type
    Given a tenant admin user is on notification types page
    # Add an event and verify the event can't be added again
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    When the user selects "tenant-service:tenant-created" in the event dropdown
    And the user clicks Next button on Select an event page
    Then the user views Add an email template page
    When the user enters "autotest subject" as subject and "autotest body" as body on "email" template page
    And the user clicks Add button in Add an email template page
    Then the user "views" the event of "tenant-service:tenant-created" in "autotest-notificationType"
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    When the user cannot select "tenant-service:tenant-created" in the event dropdown
    And the user clicks Cancel button in Select an event modal
    # Delete an event
    When the user clicks "delete" button for "tenant-service:tenant-created" in "autotest-notificationType"
    Then the user views delete "event" confirmation modal for "tenant-service:tenant-created"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the event of "tenant-service:tenant-created" in "autotest-notificationType"

  @TEST_CS-976 @REQ_CS-906 @regression
  Scenario: Test the registration of notification type in status service for application health change
    Given a tenant admin user is on notification types page
    # Verify the type and its events
    Then the user "views" the notification type card of "Application health check change"
    And the user "views" the event of "status-service:health-check-started" in "Application health check change"
    And the user "views" the event of "status-service:health-check-stopped" in "Application health check change"
    And the user "views" the event of "status-service:application-unhealthy" in "Application health check change"
    And the user "views" the event of "status-service:application-healthy" in "Application health check change"
    # Verify the events' email icons and preview links, and no edit buttons
    And the user "views" "email template indicator" for "status-service:health-check-started" in "Application health check change"
    And the user "views" "Edit button" for "status-service:health-check-started" in "Application health check change"
    And the user "views" "email template indicator" for "status-service:health-check-stopped" in "Application health check change"
    And the user "views" "Edit button" for "status-service:health-check-stopped" in "Application health check change"
    And the user "views" "email template indicator" for "status-service:application-unhealthy" in "Application health check change"
    And the user "views" "Edit button" for "status-service:application-unhealthy" in "Application health check change"
    And the user "views" "email template indicator" for "status-service:application-healthy" in "Application health check change"
    And the user "views" "Edit button" for "status-service:application-healthy" in "Application health check change"
  # Verify email template is read-only (pick one event)
  # Future work: need in-depth research on test automation with Monaco-editor before we can automate test steps.
  # When the user attempts to edit the template
  # Then the user gets "Cannot edit in read-only editor"
  # Verify the event is still there (had a bug of the event disappearing after preview)

  @TEST_CS-1081 @REQ_CS-1029 @TEST_CS-1002 @REQ_CS-1027 @regression
  Scenario: Test As a tenant admin, I can delete a subscription
    # Autotest user should be already subscribed to application health change notifications. If not, set it to subscribed
    Given a tenant admin user is on status applications page
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views the subscribe checkbox is "checked"
    # Test subscription deletion
    Given a tenant admin user is on notification subscriptions page
    When the user types "Auto Test" in Search subuscriber address as field and "adsp1.t@gov.ab.ca" in Search subscriber email field
    And the user clicks Search button on notifications page
    Then the user "views" the subscription of "Auto Test", "adsp1.t@gov.ab.ca" under "Application health check change"
    When the user clicks delete button of "Auto Test", "adsp1.t@gov.ab.ca" under "Application health check change"
    Then the user views Delete subscription modal
    And the user views the Delete subscription confirmation message of "adsp1.t@gov.ab.ca"
    When the user clicks Confirm button on Delete subscription modal
    Then the user "should not view" the subscription of "Auto Test", "adsp1.t@gov.ab.ca" under "Application health check change"
    # Restore the subscription
    Given a tenant admin user is on status applications page
    Then the user views the subscribe checkbox is "unchecked"
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views a notification message of "You are subscribed! You will receive notifications on adsp1.t@gov.ab.ca for status-application-health-change"

  @TEST_CS-986 @TEST_CS-443 @REQ_CS-1068 @REQ_CS-963 @REQ_CS-978 @regression
  Scenario: As a tenant admin, I can see notification type for application status change updates
    Given a tenant admin user is on notification types page
    Then the user "views" the notification type card of "Application status update"
    And the user views "Application status update" has self-service-allowed attribute is "yes"
    # Verify the events' email template indicator, preview link and edit button
    And the user "views" the event of "status-service:application-status-changed" in "Application status update"
    And the user "views" the event of "status-service:application-notice-published" in "Application status update"
    And the user "views" "email template indicator" for "status-service:application-status-changed" in "Application status update"
    And the user "views" "Edit button" for "status-service:application-status-changed" in "Application status update"
    And the user "views" "email template indicator" for "status-service:application-notice-published" in "Application status update"
    And the user "views" "Edit button" for "status-service:application-notice-published" in "Application status update"

  @TEST_CS-1097 @REQ_CS-1031 @regression
  Scenario: As a tenant admin, I can find subscriptions for a particular subscriber
    Given a tenant admin user is on notification subscribers page
    When the user searches subscribers with "address as" containing "auto"
    Then the user views all the subscribers with "address as" containing "auto"
    When the user searches subscribers with "email" containing "adsp1.t"
    Then the user views all the subscribers with "email" containing "adsp1.t"
    When the user searches subscribers with address as containing "auto", email containing "adsp1.t" and phone number containing "EMPTY"
    Then the user views subscribers with "address as" containing "auto" and "email" containing "adsp1.t"
    When the user expands the subscription list for the subscriber of "Auto Test" and "adsp1.t@gov.ab.ca"
    Then the user views the subscription of "status-application-health-change" for the subscriber of "Auto Test" and "adsp1.t@gov.ab.ca"

  @TEST_CS-1224 @REQ_CS-1183 @regression
  Scenario: As a tenant admin, I can delete a subscriber
    # Autotest user should be already subscribed to application health change notifications. If not, set it to subscribed
    Given a tenant admin user is on status applications page
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views the subscribe checkbox is "checked"
    # Test subscriber deletion
    Given a tenant admin user is on notification subscribers page
    When the user searches subscribers with address as containing "Auto Test", email containing "adsp1.t@gov.ab.ca" and phone number containing "EMPTY"
    Then the user "views" the subscriber of "Auto Test", "adsp1.t@gov.ab.ca", "EMPTY"
    When the user clicks "delete" button of "Auto Test", "adsp1.t@gov.ab.ca" on subscribers page
    Then the user views Delete subscriber modal
    # The validation of delete confirmation modal content is skipped due to the bug of CS-1266
    # And the user views the Delete subscriber confirmation message of "adsp1.t@gov.ab.ca"
    When the user clicks Delete button on Delete subscriber modal
    Then the user "should not view" the subscriber of "Auto Test", "adsp1.t@gov.ab.ca", "EMPTY"
    When the user selects "Subscriptions" tab for "Notification"
    Then the user "should not view" the subscription of "Auto Test", "adsp1.t@gov.ab.ca" under "Status-Application-Health-Change"
    # Restore the subscription
    Given a tenant admin user is on status applications page
    Then the user views the subscribe checkbox is "unchecked"
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views a notification message of "You are subscribed! You will receive notifications on adsp1.t@gov.ab.ca for status-application-health-change"

  @TEST_CS-1191 @REQ_CS-1148 @regression
  Scenario Outline: As a tenant admin, I can configure subscription management contact information on notifications overview page
    Given a tenant admin user is on notification overview page
    When the user clicks edit button for contact information
    Then the user views Edit contact information modal on notification overview page
    When the user enters "<Email>", "<Phone>" and "<Instructions>" in Edit contact information modal
    And the user clicks Save button in Edit contact information modal
    Then the user views contact information of "<Email>", "<Phone>" and "<Instructions>" on notifications page
    # In the step definition, rnd{} will use a random 4-digit number to attach/replace part of the static strings in {}
    And the user should be able to view "<Email>", "<Phone>" and "<Instructions>" as contact information in the subscription app
    Examples:
      | Email              | Phone           | Instructions  |
      | rnd{abc@gov.ab.ca} | rnd{7805671456} | rnd{autotest} |

  # TEST DATA: an existing subscriber with address as of "autotest-DO-NOT-DELETE" and email of "adsp2.t@gov.ab.ca"
  @TEST_CS-1102 @REQ_CS-1130 @regression
  Scenario: As a tenant admin, I can modify a subscriber name and email
    Given a tenant admin user is on notification subscribers page
    When the user searches subscribers with address as containing "autotest-DO-NOT-DELETE", email containing "adsp2.t@gov.ab.ca" and phone number containing "EMPTY"
    And the user clicks Edit button of "autotest-DO-NOT-DELETE" and "adsp2.t@gov.ab.ca" on subscribers page
    Then the user views Edit subscriber modal
    When the user modifies the name to "autotest2-DO-NOT-DELETE" and email to "auto.test22@gov.ab.ca" in subscriber modal
    And the user clicks Save button in Edit subscriber modal
    When the user searches subscribers with address as containing "autotest2-DO-NOT-DELETE", email containing "auto.test22@gov.ab.ca" and phone number containing "EMPTY"
    Then the user "views" the subscriber of "autotest2-DO-NOT-DELETE", "auto.test22@gov.ab.ca", "EMPTY"
    When the user clicks Edit button of "autotest2-DO-NOT-DELETE" and "auto.test22@gov.ab.ca" on subscribers page
    And the user modifies the name to "autotest-DO-NOT-DELETE" and email to "adsp2.t@gov.ab.ca" in subscriber modal
    Then the user clicks Save button in Edit subscriber modal
    When the user searches subscribers with address as containing "autotest-DO-NOT-DELETE", email containing "adsp2.t@gov.ab.ca" and phone number containing "EMPTY"
    Then the user "views" the subscriber of "autotest-DO-NOT-DELETE", "adsp2.t@gov.ab.ca", "EMPTY"

  @TEST_CS-1372 @REQ_CS-1308 @REQ_CS-1309 @regression
  Scenario: As a tenant admin, I can search, add, edit and delete SMS number of a subscriber
    Given a tenant admin user is on notification subscribers page
    # Add a number
    When the user searches subscribers with address as containing "autotest-DO-NOT-DELETE", email containing "adsp4.t@gov.ab.ca" and phone number containing "EMPTY"
    Then the user "views" the subscriber of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca", "EMPTY"
    When the user clicks "edit" button of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca" on subscribers page
    Then the user views Edit subscriber modal
    When the user enters "7808001234" in Phone number field
    And the user clicks Save button in Edit subscriber modal
    And the user searches subscribers with address as containing "autotest-DO-NOT-DELETE", email containing "adsp4.t@gov.ab.ca" and phone number containing "7808001234"
    Then the user "views" the subscriber of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca", "7808001234"
    # Edit a number
    When the user clicks "edit" button of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca" on subscribers page
    Then the user views Edit subscriber modal
    When the user enters "7808005678" in Phone number field
    And the user clicks Save button in Edit subscriber modal
    And the user searches subscribers with address as containing "autotest-DO-NOT-DELETE", email containing "adsp4.t@gov.ab.ca" and phone number containing "7808005678"
    Then the user "views" the subscriber of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca", "7808005678"
    # Delete a number
    When the user clicks "edit" button of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca" on subscribers page
    Then the user views Edit subscriber modal
    When the user enters "EMPTY" in Phone number field
    And the user clicks Save button in Edit subscriber modal
    And the user searches subscribers with address as containing "autotest-DO-NOT-DELETE", email containing "adsp4.t@gov.ab.ca" and phone number containing "EMPTY"
    Then the user "views" the subscriber of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca", "EMPTY"

  # CS-4536 Monaco editor bug to be resolved before enabling the test again
  @TEST_CS-1339 @REQ_CS-1308 @REQ_CS-1233 @regression @ignore
  Scenario: As a tenant admin, I can configure what channels are supported by a notification type, so that I can support multiple channels of notifications.
    Given a tenant admin user is on notification types page
    # Add a notification type
    When the user clicks Add notification type button on Notification type page
    Then the user views Add notification type modal
    When the user enters "autotest-add-multi-channels", "autotest notification desc", "public", "yes", "yes", "yes" on notification type modal
    Then the user views that email channel is greyed out
    And the user clicks Save button in notification type modal
    Then the user "views" the notification type card of "autotest-add-multi-channels", "autotest notification desc", "public", "yes", "yes"
    # Add an event
    When the user clicks Select event button for "autotest-add-multi-channels"
    Then the user views Select an event modal
    When the user selects "form-service:form-submitted" in the event dropdown
    And the user clicks Next button on Select an event page
    Then the user views Add an email template page
    When the user enters "autotest subject" as subject and "autotest body" as body on "email" template page
    Then the user selects "SMS" tab on the event template
    When the user enters "autotest subject" as subject and "autotest body" as body on "SMS" template page
    And the user clicks Add button in Add an email template page
    Then the user "views" the event of "form-service:form-submitted" in "autotest-add-multi-channels"
    And the user "views" "email template indicator" for the event of "form-service:form-submitted" in "autotest-add-multi-channels" on tenant events
    And the user "views" "sms template indicator" for the event of "form-service:form-submitted" in "autotest-add-multi-channels" on tenant events
    And the user "views" "bot template indicator with warning" for the event of "form-service:form-submitted" in "autotest-add-multi-channels" on tenant events
    # Edit the event, remove bot & sms channels from template
    When the user clicks "edit" button for the notification type card of "autotest-add-multi-channels"
    Then the user views Edit notification type modal for "autotest-add-multi-channels"
    And the user views that email channel is greyed out
    When the user enters "autotest-edit-multi-channels", "Edited notification type desc", "auto-test-role1", "no", "no", "no" on notification type modal
    And the user clicks Save button in notification type modal
    Then the user "views" the notification type card of "autotest-edit-multi-channels", "Edited notification type desc", "auto-test-role1", "no", "no"
    And the user "views" "email template indicator" for the event of "form-service:form-submitted" in "autotest-edit-multi-channels" on tenant events
    And the user "should not view" "sms template indicator" for the event of "form-service:form-submitted" in "autotest-edit-multi-channels" on tenant events
    And the user "should not view" "bot template indicator" for the event of "form-service:form-submitted" in "autotest-edit-multi-channels" on tenant events
    # Add back bot and sms channels to see the template preserved
    When the user clicks "edit" button for the notification type card of "autotest-edit-multi-channels"
    Then the user views Edit notification type modal for "autotest-edit-multi-channels"
    When the user enters "autotest-edit-multi-channels", "Edited notification type desc", "auto-test-role2, beta-tester", "yes", "yes", "no" on notification type modal
    And the user clicks Save button in notification type modal
    Then the user "views" the notification type card of "autotest-edit-multi-channels", "Edited notification type desc", "auto-test-role2, beta-tester", "no", "no"
    And the user "views" "sms template indicator" for the event of "form-service:form-submitted" in "autotest-edit-multi-channels" on tenant events
    And the user "views" "bot template indicator with warning" for the event of "form-service:form-submitted" in "autotest-edit-multi-channels" on tenant events
    # Delete the notification type
    When the user clicks "delete" button for the notification type card of "autotest-edit-multi-channels"
    Then the user views delete "notification type" confirmation modal for "autotest-edit-multi-channels"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the notification type card of "autotest-edit-multi-channels", "Edited notification type desc", "auto-test-role2, beta-tester", "no", "no"

  # TEST DATA: a precreated event of "Autotest:autotest-eventDefinition" in "autotest-notificationType"
  @TEST_CS-1157 @REQ_CS-1070 @regression
  Scenario: As a tenant admin, I can preview the rendered notification message, so I know what my subscribers will receive.
    Given a tenant admin user is on notification types page
    When the user clicks "edit" button for "Autotest:autotest-eventDefinition" in "autotest-notificationType"
    Then the user views an email template modal title for "Autotest:autotest-eventDefinition"
    And the user views the email subject "Autotest"
    And the user views the email body "Autotest"
    When the user clicks Close button in event template modal
    Then Preview event template modal is closed

  @TEST_CS-1289 @REQ_CS-1269 @regression
  Scenario: As a tenant admin, I can access subscription management from the notification email preview.
    Given a tenant admin user is on notification types page
    Then the user "views" the event of "status-service:health-check-started" in "Application health check change"
    When the user clicks "edit" button for "status-service:health-check-started" in "Application health check change"
    Then the user views the link for managing email subscription
    When the user clicks Close button in event template modal
    Then Preview event template modal is closed

  # CS-4536 Monaco editor bug to be resolved before enabling the test again
  @TEST_CS-1170 @REQ_CS-1074 @regression @ignore
  Scenario: As a tenant admin, I can override the email template for a platform notification type, so that I can customize the notification that is sent
    Given a tenant admin user is on notification types page
    When the user clicks "edit" button for "status-service:application-status-changed" in "Application status update"
    Then the user views an email template modal title for "status-service:application-status-changed"
    When the user enters "autotest subject" as subject and "autotest body" as body on "email" template page
    And the user clicks Save all button in template modal
    Then the user "views" Reset button for "status-service:application-status-changed" in "Application status update"
    When the user clicks "Reset" button for "status-service:application-status-changed" in "Application status update"
    Then the user views Reset email template modal
    When the user clicks Delete button in Reset email template modal
    Then the user "should not view" Reset button for "status-service:application-status-changed" in "Application status update"

  # TEST DATA: a precreated subscription of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca" under "Application health check change" with some criteria details
  @TEST_CS-1431 @REQ_CS-1404 @regression
  Scenario: As a tenant admin, I can see criteria details for a subscription with criteria, so I know the context for which a user receives notifications
    Given a tenant admin user is on notification subscriptions page
    When the user types "autotest-DO-NOT-DELETE" in Search subuscriber address as field and "adsp4.t@gov.ab.ca" in Search subscriber email field
    And the user clicks Search button on notifications page
    Then the user "views" the subscription of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca" under "Application health check change"
    When the user clicks eye icon of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca" under "Application health check change"
    Then the user views the details of "autotest-DO-NOT-DELETE", "adsp4.t@gov.ab.ca" under "Application health check change"

  # CS-4536 Monaco editor bug to be resolved before enabling the test again
  @TEST_CS-329 @REQ_CS-1087 @regression @ignore
  Scenario: As a tenant admin, I can preview an email template as I edit, so I have an accurate preview of the notification.
    Given a tenant admin user is on notification types page
    # Preview in Add flow
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    When the user selects "tenant-service:tenant-deleted" in the event dropdown
    And the user clicks Next button on Select an event page
    Then the user views Add an email template page
    When the user enters "autotest subject" as subject and "autotest body" as body on "email" template page
    Then the user views the email template preview of "autotest subject" as subject and "autotest body" as body
    And the user clicks Add button in Add an email template page
    # Preview in Edit mode
    When the user clicks "Edit" button for "tenant-service:tenant-deleted" in "autotest-notificationType"
    Then the user views an email template modal title for "tenant-service:tenant-deleted"
    When the user enters "autotest subject edited" as subject and "autotest body edited" as body on "email" template page
    Then the user views the email template preview of "autotest subject edited" as subject and "autotest body edited" as body
    When the user clicks Save all button in template modal
    # Delete an event
    And the user clicks "delete" button for "tenant-service:tenant-deleted" in "autotest-notificationType"
    Then the user views delete "event" confirmation modal for "tenant-service:tenant-deleted"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the event of "tenant-service:tenant-deleted" in "autotest-notificationType"

  # CS-4536 Monaco editor bug to be resolved before enabling the test again
  @TEST_CS-1375 @REQ_CS-1237 @regression @ignore
  Scenario: As a tenant admin, I can configure an SMS message template for a notification type event, so I can provide SMS notifications.
    Given a tenant admin user is on notification types page
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    When the user selects "status-service:application-status-changed" in the event dropdown
    And the user clicks Next button on Select an event page
    When the user selects "SMS" tab on the event template
    And the user enters "{{event.payload.application.name}} status is changed" as subject and "{{event.payload.application.description}} status is changed body" as body on "SMS" template page
    Then the user views the SMS template preview of "{{event.payload.application.name}} status is changed" as subject and "{{event.payload.application.description}} status is changed body" as body
    When the user clicks Save all button in template modal
    Then the user "views" "sms template indicator" for the event of "status-service:application-status-changed" in "autotest-notificationType" on tenant events
    # Delete an event
    When the user clicks "delete" button for "status-service:application-status-changed" in "autotest-notificationType"
    Then the user views delete "event" confirmation modal for "status-service:application-status-changed"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the event of "status-service:application-status-changed" in "autotest-notificationType"

  # CS-4536 Monaco editor bug to be resolved before enabling the test again
  @TEST_CS-1392 @REQ_CS-1234 @regression @ignore
  Scenario: As a tenant admin, I can configure a Bot message template for a notification type event, so I can provide slack/teams notifications.
    Given a tenant admin user is on notification types page
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    When the user selects "status-service:application-notice-published" in the event dropdown
    And the user clicks Next button on Select an event page
    When the user selects "Bot" tab on the event template
    And the user enters "{{event.payload.application.name}} has a notice published" as subject and "{{event.payload.application.name}} has a notice published body" as body on "bot" template page
    Then the user views the Bot template preview of "{{event.payload.application.name}} has a notice published" as subject and "{{event.payload.application.name}} has a notice published body" as body
    When the user clicks Save all button in template modal
    Then the user "views" "bot template indicator" for the event of "status-service:application-notice-published" in "autotest-notificationType" on tenant events
    # Delete an event
    When the user clicks "delete" button for "status-service:application-notice-published" in "autotest-notificationType"
    Then the user views delete "event" confirmation modal for "status-service:application-notice-published"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the event of "status-service:application-notice-published" in "autotest-notificationType"

  @TEST_CS-1164 @REQ_CS-1072 @regression
  Scenario: As a tenant admin, I can configure a notification email message template to use standard GoA email format, so that I can have a consistent look for emails.
    Given a tenant admin user is on notification types page
    # Preview an email without <html> or </html>
    When the user clicks "edit" button for "form-service:form-locked" in "autotest-notificationType"
    Then the user views an email template modal title for "form-service:form-locked"
    And the user views the hint text for GoA wrapper in event template modal
    And the user "views" GoA header and footer in the email preview
    When the user clicks Close button in event template modal
    Then Event template modal is closed
    # Preview a html email with <html> and </html>
    When the user clicks "edit" button for "form-service:form-unlocked" in "autotest-notificationType"
    Then the user views an email template modal title for "form-service:form-unlocked"
    And the user "should not view" GoA header and footer in the email preview
    When the user clicks Close button in event template modal
    Then Event template modal is closed

  # TEST DATA: a precreated event of "Autotest:autotest-eventDefinition" in "autotest-notificationType"
  # Copy link icon fails accessibility test for now. Ignore the test for now
  @accessibility @regression @ignore
  Scenario: As a tenant admin, I can use notification pages without any critical or serious accessibility issues
    Given a tenant admin user is on notification overview page
    Then no critical or serious accessibility issues on "notification overview page"
    When the user clicks edit button for contact information
    Then the user views Edit contact information modal on notification overview page
    #And no critical or serious accessibility issues for "edit notification contact information modal" on "notification overview page"
    And the user clicks Cancel button in Edit contact information modal
    When the user clicks Add notification type button
    Then the user views Add notification type modal
    ## CS-1833 is pending for fix
    # And no critical or serious accessibility issues for "notification type modal" on "notification overview page"
    When the user clicks Cancel button in notification type modal
    Then no critical or serious accessibility issues on "notification notification types page"
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    ## CS-1826 is pending for fix
    # And no critical or serious accessibility issues for "select an event modal" on "notification notification types page"
    When the user clicks Cancel button in Select an event modal
    When the user clicks "edit" button for "Autotest:autotest-eventDefinition" in "autotest-notificationType"
    Then the user views an email template modal title for "Autotest:autotest-eventDefinition"
    #And no critical or serious accessibility issues for "event template modal" on "notification types page"
    When the user clicks Close button in event template modal
    Then Preview event template modal is closed
    When the user selects "Subscriptions" tab for "Notification"
    Then no critical or serious accessibility issues on "notification subscriptions page"
    When the user selects "Subscribers" tab for "Notification"
    Then no critical or serious accessibility issues on "notification subscribers page"

  @TEST_CS-3364 @REQ_CS-3331 @regression
  Scenario: As a tenant admin, I can configure the from email of notifications, so subscribers receive notifications from a known email
    Given a tenant admin user is on notification overview page
    # Invalid email address and help content
    When the user clicks Edit button for email information
    Then the user "views" Edit email information modal
    And the user views help content of "Email must be a real email with a inbox"
    When the user enters "adsp.t.gov.ab.ca" in the email field in Edit email information modal
    And clicks Save button in Edit email information modal
    Then the user views "You must enter a valid email" in the Edit email information modal
    When the user clicks Cancel button in the Edit email information modal
    Then the user "should not view" Edit email information modal
    And the user "should not view" the email address of "adsp.t.gov.ab.ca" under From email
    # New valid from email address
    When the user clicks Edit button for email information
    Then the user "views" Edit email information modal
    When the user enters "auto.test@gov.ab.ca" in the email field in Edit email information modal
    And clicks Save button in Edit email information modal
    Then the user "views" the email address of "auto.test@gov.ab.ca" under From email
    # Restore to the default from email address
    When the user clicks Edit button for email information
    Then the user "views" Edit email information modal
    When the user enters "adsp.t@gov.ab.ca" in the email field in Edit email information modal
    And clicks Save button in Edit email information modal
    Then the user "views" the email address of "adsp.t@gov.ab.ca" under From email