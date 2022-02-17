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
    Then the user "views" the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>"
    When the user clicks "edit" menu for the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>", "<End Time>"
    Then the user views Edit notice dialog
    When the user enters "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>" on notice dialog
    And the user clicks Save as draft button
    Then the user "views" the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    When the user clicks "delete" menu for the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"
    Then the user "should not view" the "draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"

    Examples:
      | Description        | Application | Start Date | Start Time | End Date | End Time | Description2            | Application2 | Start Date 2 | Start Time 2 | End Date 2 | End Time 2 |
      | Autotest-NewNotice | Autotest    | Today      | 02:00 pm   | Today    | 11:00 pm | Autotest-ModifiedNotice | File Service | Today        | 10:00 am     | Today      | 02:00 pm   |

  # TEST DATA: "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
  @TEST_CS-782 @REQ_CS-667 @regression
  Scenario: As a service owner, I can publish and un-publish a notice
    Given a service owner user is on status notices page
    When the user clicks "publish" menu for the "Draft" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    Then the user "views" the "Published" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    When the user clicks "unpublish" menu for the "Published" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"
    Then the user "views" the "Draft" notice of "Drafted notice - AUTOMATED TEST ONLY", "Autotest", "1/1/2020", "12:00 am", "1/1/2020", "12:00 pm"

  # TEST DATA: an application named "Autotest"
  @TEST_CS-783 @REQ_CS-667 @regression
  Scenario: As a service owner, I can add, publish and archive a notice
    Given a service owner user is on status notices page
    When the user clicks Add notice button
    Then the user views Add notice dialog
    When the user enters "Autotest-AddPublishArchive", "Autotest", "Today", "10:00 am", "Today", "02:00 pm" on notice dialog
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
    Then the user views a callout message of "You are unsubscribed! You will no longer receive notifications on auto.test@gov.ab.ca for status-application-health-change"
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
    And the user selects "All" filter by status radio button
    Then the user "should not view" the "Draft" notice of "<Description2>", "<Application>", "<Start Date 2>", "<Start Time 2>", "<End Date 2>", "<End Time 2>"

    Examples:
      | Description           | Application | Start Date | Start Time | End Date | End Time | Description2               | Application2 | Start Date 2 | Start Time 2 | End Date 2 | End Time 2 |
      | Autotest-NewAllNotice | All         | Today      | 12:00 am   | Today    | 12:00 am | Autotest-ModifiedAllNotice | Autotest     | Today        | 10:00 am     | Today      | 02:00 pm   |
      

