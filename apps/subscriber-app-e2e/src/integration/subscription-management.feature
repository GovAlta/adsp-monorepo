Feature: Subscription management

  @TEST_CS-442 @smoke-test
  Scenario: As GoA staff, I can see an overview page for the subscription management
    When a user goes to subscription management overview site
    Then the user views the overview page of subscription management

  # Ignore accessibility test due to callout icon issue after react component upgrade
  @accessibility @regression @ignore
  Scenario: As a user, I can see the subscription management page without any critical and serious accessibility issues
    When a user goes to subscription management overview site
    Then no critical or serious accessibility issues on "subscription management overview" page

  # Ignore accessibility test due to callout icon issue after react component upgrade
  @accessibility @regression @ignore
  Scenario: As a tenant admin, I can use subscription management page without any critical and serious accessibility issues
    When an authenticated user with "auto.contact" and "autotest" is in the subscriber app
    Then the user views subscription management page
    And no critical or serious accessibility issues on "authenticated subscription management" page

  # Application health check change is changed to be self-serve subscription. Created a task to deal with this change: https://goa-dio.atlassian.net/browse/CS-2859
  @TEST_CS-995 @REQ_CS-915 @TEST_CS-1248 @REQ_CS-1040 @REQ_CS-1502 @regression @ignore
  Scenario: As an authenticated stakeholder, I can login to see non-self-serve subscriptions
    When an authenticated user with "auto.contact" and "autotest" is in the subscriber app
    Then the user views subscription management page
    And the user views the user contact information
    And the user views the subscription of "Application health check change" and its description
    And the user views the support link for the subscription of "Application health check change"

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
    Then the user views a notification message of "Contact information updated."
    And the user views contact information of "auto.contact.test@gmail.com", "780 100 1234" and "sms"
    When the user clicks edit contact information button
    And the user enters "auto.contact.test@gmail.com" as email, "EMPTY" as phone number and "email" as preferred channel
    And the user clicks Save button in contact information
    Then the user views a notification message of "Contact information updated."
    And the user views contact information of "auto.contact.test@gmail.com", "EMPTY" and "email"

  @TEST_CS-1413 @REQ_CS-1240 @regression
  # prior the test authenticated user should have subscription to Application health check change
  Scenario: As a subscriber, I can see the supported channels of a notification type in the subscriber app, so I know what's available.
    When an authenticated user with "auto.contact" and "autotest" is in the subscriber app
    Then the user views subscription management page
    When the user clicks edit contact information button
    And the user enters "auto.contact.test@gmail.com" as email, "7801001234" as phone number and "sms" as preferred channel
    And the user clicks Save button in contact information
    Then the user views the checked "sms" icon for "Application health check change"
    When the user clicks edit contact information button
    And the user enters "auto.contact.test@gmail.com" as email, "7801001234" as phone number and "email" as preferred channel
    And the user clicks Save button in contact information
    Then the user views the checked "email" icon for "Application health check change"

  @TEST_CS-2890 @REQ_CS-2863 @regression
  Scenario: As a subscriber, I can login to the subscription app using the tenant name, so I can access my subscriptions
    When the user access subscriber app login with the tenant name of "autotest"
    Then the user can access the log in page with the corresponding tenant id showing in the URL
    When the user access subscriber app login with the tenant name of "justice-digital"
    Then the user can access the log in page with the corresponding tenant id showing in the URL
    When the user access subscriber app login with the tenant name of "nonExistedTenant"
    Then the user is redirected to the subscription management overview page
