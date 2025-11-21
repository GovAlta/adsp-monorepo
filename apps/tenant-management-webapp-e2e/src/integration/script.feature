@script
Feature: Script

  # CS-4536 Monaco editor bug to be resolved before enabling the test again
  @TEST_CS-1741 @REQ_CS-1656 @REQ_CS-1657 @REQ_CS-1658 @regression @ignore
  Scenario: As a tenant admin, I can add, edit and delete a script
    Given a tenant admin user is on script service overview page
    When the user clicks Add script button
    Then the user views Add script modal
    # Invalid data
    When the user enters "auto-test-1-$" in name field in script modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" on namespace in script modal
    # Validate data
    When the user enters "autotest-addscript", "autotest script desc", "yes", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin" in Add script modal
    And the user clicks Save button in Add script modal
    Then the user "views" the script of "autotest-addscript", "autotest script desc"
    # Edit
    When the user clicks "Edit" button for the script of "autotest-addscript", "autotest script desc"
    Then the user views the script editor for "autotest-addscript", "autotest script desc"
    When the user clicks Edit button in script editor
    Then the user views Edit script modal
    When the user enters "autotest-modifiedscript" as name "autotest script desc 2" as description in Edit script modal
    Then the user clicks Save button in Edit script modal
    And the user enters "test" as lua script
    And the user selects "Roles" tab in script editor
    And the user enters "auto-test-role2, urn:ads:autotest:chat-service:chatter" for roles in script editor
    And the user clicks Save button in script editor
    And the user clicks Back button in script editor
    Then the user "views" the script of "autotest-modifiedscript", "autotest script desc 2"
    # Delete
    When the user clicks "Delete" button for the script of "autotest-modifiedscript", "autotest script desc 2"
    Then the user views delete "script" confirmation modal for "autotest-modifiedscript"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the script of "autotest-modifiedscript", "autotest script desc 2"

  @TEST_CS-1739 @REQ_CS-1655 @regression
  Scenario: As a tenant admin, I can see the overview for a script service, so I know about the service
    Given a tenant admin user is on script service overview page
    Then the user views the "Script service" overview content "The script services provides"
    And the user views the link of API docs for "Script service"
    And the user views the link of See the code for "script-service"
    And the user views the link of "Get support" under Support

  @accessibility @regression
  Scenario: As a tenant admin, I can use scripts page without any critical or serious accessibility issues
    Given a tenant admin user is on script service overview page
    Then no critical or serious accessibility issues on "script overview page"
    When the user clicks Add script button
    Then the user views Add script modal
    ## CS-1833 is pending for fix
    # And no critical or serious accessibility issues for "add script modal" on "script overview page"
    When the user clicks Cancel button in Add script modal
# Then no critical or serious accessibility issues on "script scripts page"
## CS-1845 is pending for fix
# When the user clicks "Edit" button for the script of "autotest-execute-script", "DO NOT DELETE", "urn:ads:platform:tenant-service:tenant-admin"
# And no critical or serious accessibility issues for "script edit modal" on "script scripts page"
