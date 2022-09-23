@script
Feature: Script

  @TEST_CS-1741 @REQ_CS-1656 @REQ_CS-1658 @regression
  Scenario: As a tenant admin, I can add and delete a script
    Given a tenant admin user is on script service overview page
    When the user clicks Add script button
    Then the user views Add script modal
    # Invalid data
    When the user enters "auto-test-1-$" in name field in script modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" on namespace in script modal
    # Validate data
    When the user enters "autotest-adddeletescript", "autotest script desc", "yes", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin" in Add script modal
    And the user clicks Save button in Add script modal
    Then the user "views" the script of "autotest-adddeletescript", "autotest script desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin"
    # Delete
    When the user clicks "Delete" button for the script of "autotest-adddeletescript", "autotest script desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin"
    Then the user views delete "script" confirmation modal for "autotest-adddeletescript"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the script of "autotest-adddeletescript", "autotest script desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin"