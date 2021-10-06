@service-status
Feature: Service status

  @TEST_CS-528 @REQ_CS-283 @regression
  Scenario: Test As a developer, I can access recommendations about health check, so I can add an appropriate health check to my app
    Given a service owner user is on service status page
    Then the user views the health check guidelines

  @TEST_CS-781 @REQ_CS-667 @regression
  Scenario Outline: As a service owner, I can add, edit and delete a notice
    Given a service owner user is on status notices page
    When the user clicks add a Draft Notice button
    Then the user views Add a Draft Notice dialog
    When the user enters "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>",  "<End Time>"
    And the user clicks Save as Draft button
    Then the user "views" the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>",  "<End Time>"
    When the user clicks "edit" menu for the "Draft" notice of "<Description>", "<Application>", "<Start Date>", "<Start Time>", "<End Date>",  "<End Time>"
    Then the user views Edit Draft Notice dialog
    When the user enters "<Description2>", "<Application2>", "<Start Date 2>", " <Start Time 2>", "<End Date 2>",  "<End Time 2>"
    And the user clicks Save as Draft button
    Then the user "views" the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", " <Start Time 2>", "<End Date 2>",  "<End Time 2>"
    When the user clicks "delete" menu for the "Draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", " <Start Time 2>", "<End Date 2>",  "<End Time 2>"
    Then the user "should not view" the "draft" notice of "<Description2>", "<Application2>", "<Start Date 2>", " <Start Time 2>", "<End Date 2>",  "<End Time 2>"

    Examples:
      | Description        | Application | Start Date | Start Time | End Date | End Time | Description2            | Application2 | Start Date 2 | Start Time 2 | End Date 2 | End Time 2 |
      | Autotest-NewNotice | Autotest    | Today      | 10:00 am   | Today    | 02:00 pm | Autotest-ModifiedNotice | File Service | Today        | 10:00 am     | Today      | 02:00 pm   |