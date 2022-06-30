Feature: Subscription management

  @TEST_CS-442 @smoke-test
  Scenario: As GoA staff, I can see an overview page for the subscription management
    When a user goes to subscription management overview site
    Then the user views the overview page of subscription management

  @accessibility @regression
  Scenario: As a user, I can see the subscription management page without any critical and serious accessibility issues
    When a user goes to subscription management overview site
    Then no critical or serious accessibility issues on "subscription management" page

  @TEST_CS-995 @REQ_CS-915 @TEST_CS-1248 @REQ_CS-1040 @REQ_CS-1502 @regression
  Scenario: As an authenticated stakeholder, I can login to see non-self-serve subscriptions
    When an authenticated user with "auto.contact" and "autotest" is in the subscriber app
    Then the user views subscription management page
    And the user views the user contact information
    # the user with auto.contact.test@gmail.com should be subscribed to below app
    And the user views the support link for the subscription of "Application health check change"
    And the user views the subscription of "Application health check change" and its description

  @TEST_CS-1371 @REQ_CS-1238 @REQ_CS-1239 @regression
  Scenario: As a tenant admin, I can configure what channels are supported by a notification type, so that I can support multiple channels of notifications.
    When an authenticated user with "auto.contact" and "autotest" is in the subscriber app
    Then the user views subscription management page
    When the user clicks edit contact information button
    And the user enters an invalid phone number in contact information
    And the user clicks Save button in contact information
    Then the user views an error message for the invalid phone number in contact information
    When the user removes phone number value in contact information
    And the user selects "sms" as the preferred channel in contact information
    And the user clicks Save button in contact information
    Then the user views an error messsage for missing phone number
    When the user removes email value in contact information
    And the user clicks Save button in contact information
    Then the user views an error messsage for missing email
    When the user enters "auto.contact.test@gmail.com" as email, "7801001234" as phone number and "sms" as preferred channel
    And the user clicks Save button in contact information
    Then the user views a callout message of "Contact information updated."
    And the user views contact information of "auto.contact.test@gmail.com", "780 100 1234" and "sms"
    When the user clicks edit contact information button
    And the user enters "auto.contact.test@gmail.com" as email, "EMPTY" as phone number and "email" as preferred channel
    And the user clicks Save button in contact information
    Then the user views a callout message of "Contact information updated."
    And the user views contact information of "auto.contact.test@gmail.com", "EMPTY" and "email"

