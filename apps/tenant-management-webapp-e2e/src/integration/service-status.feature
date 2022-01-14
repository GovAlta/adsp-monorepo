@service-status
Feature: Service status

  @TEST_CS-528 @REQ_CS-283 @regression
  Scenario: Test As a developer, I can access recommendations about health check, so I can add an appropriate health check to my app
    Given a service owner user is on service status page
    Then the user views the health check guidelines

  @TEST_CS-781 @REQ_CS-667 @regression
  Scenario Outline: As a service owner, I can add, edit and delete a notice
    Given a service owner user is on status notices page
    When the user clicks Add a draft notice button
    Then the user views Add a draft notice dialog
    When the user enters "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>"
    And the user clicks Save as draft button
    Then the user "views" the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>"
    When the user clicks "edit" menu for the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>"
    Then the user views Edit draft notice dialog
    When the user enters "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    And the user clicks Save as draft button
    Then the user "views" the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    When the user clicks "delete" menu for the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    Then the user "should not view" the "draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"

    Examples:
      | Description        | Application | Start Date | Start Time | End Date | End Time | Description2            | Application2 | Start Date 2 | Start Time 2 | End Date 2 | End Time 2 |
      | Autotest-NewNotice | Autotest    | Today      | 02:00 pm   | Today    | 11:00 pm | Autotest-ModifiedNotice | File Service | Today        | 10:00 am     | Today      | 02:00 pm   |

  # Test data needed for running this test: "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
  @TEST_CS-782 @REQ_CS-667 @regression
  Scenario: As a service owner, I can publish and un-publish a notice
    Given a service owner user is on status notices page
    When the user clicks "publish" menu for the "Draft" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    Then the user "views" the "Published" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    When the user clicks "unpublish" menu for the "Published" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    Then the user "views" the "Draft" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"

  @TEST_CS-783 @REQ_CS-667 @regression
  Scenario: As a service owner, I can add, publish and archive a notice
    Given a service owner user is on status notices page
    When the user clicks Add a draft notice button
    Then the user views Add a draft notice dialog
    When the user enters "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    And the user clicks Save as draft button
    Then the user "views" the "Draft" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    When the user clicks "publish" menu for the "Draft" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    Then the user "views" the "Published" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    When the user clicks "archive" menu for the "Published" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    Then the user "views" the "Archived" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"
    And the user "should not view" the gear icon for the "Archived" notice of "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm"

  @TEST_CS-784 @REQ_CS-667 @regression
  Scenario: As a service owner, I can filter notices by status
    Given a service owner user is on status notices page
    When the user selects "Draft" filter by status radio button
    Then the user views "Draft" notices
    When the user selects "Published" filter by status radio button
    Then the user views "Published" notices
    When the user selects "Archived" filter by status radio button
    Then the user views "Archived" notices
    When the user selects "All" filter by status radio button
    Then the user views "All" notices

  @TEST_CS-936 @REQ_CS-907 @regression
  Scenario: As a tenant admin, I can subscribe to health check notification type
    Given a tenant admin user is on status applications page
    # Autotest user should be already subscribed to application health change notifications. If not, set it to subscribed
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views the subscribe checkbox is "checked"
    # Unsubscribe application health change notifications
    When the user "unselects" the subscribe checkbox for health check notification type
    Then the user views a subscription confirmation message for "unsubscribed"
    When the user selects the "Dashboard" menu item
    And the user selects the "status" menu item
    And the user selects "Applications" tab for "Status"
    Then the user views the subscribe checkbox is "unchecked"
    # Subscribe application health change notifications
    When the user "selects" the subscribe checkbox for health check notification type
    Then the user views a subscription confirmation message for "subscribed"
    When the user selects the "Dashboard" menu item
    And the user selects the "status" menu item
    And the user selects "Applications" tab for "Status"
    Then the user views the subscribe checkbox is "checked"