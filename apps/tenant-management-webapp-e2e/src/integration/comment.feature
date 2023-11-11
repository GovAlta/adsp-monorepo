@comment
Feature: Comment

  @TEST_CS-2435 @REQ_CS-2399 @regression
  Scenario: As a tenant admin, I can see an overview of the comment service, so I understand what it is used for
    Given a tenant admin user is on comment service overview page
    Then the user views the "Comment service" overview content "Comment services allows"
    And the user views the link of API docs for "Comment service"
    And the user views the link of See the code for "comment-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-2441 @TEST_CS-2440 @TEST_CS-2442 @TEST_CS-2445 @REQ_CS-2393 @REQ_CS-2395 @REQ_CS-22396 @REQ_CS-2394 @regression
  Scenario: As a tenant admin, I can add and delete a comment topic type
    Given a tenant admin user is on comment service overview page
    When the user clicks Add topic type button on comment service overview page
    Then the user views Add topic type modal
    When the user clicks Cancel button in Add topic type modal
    Then the user views topic types page
    # Invalid data
    When the user clicks Add topic type button on topic types page
    Then the user views Add topic type modal
    When the user enters "auto-test-1-$" in Add topic type modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" for Name field in Add topic type modal
    # Validate data
    When the user enters "autotest-topicType" in Add topic type modal
    And the user clicks Save button in Add topic type modal
    Then the user views topic type editor for "autotest-topicType"
    When the user enters "auto-test-role1" as admin roles, "auto-test-role2" as commenter roles, "empty" as reader roles
    And the user clicks Save button on topic type editor
    Then the user "views" the topic type of "autotest-topicType", "auto-test-role1", "auto-test-role2", "empty"
    # Edit and back
    When the user clicks "Edit" button for the topic type of "autotest-topicType", "auto-test-role1", "auto-test-role2", "empty"
    Then the user views topic type editor for "autotest-topicType"
    When the user enters "auto-test-role2" as admin roles, "auto-test-role1" as commenter roles, "auto-test-role3" as reader roles
    And the user clicks Back button on topic type editor
    And the user clicks "Don't save" button on unsaved changes modal
    Then the user "should not view" the topic type of "autotest-topicType", "auto-test-role2", "auto-test-role1", "auto-test-role3"
    # Edit and save
    When the user clicks "Edit" button for the topic type of "autotest-topicType", "auto-test-role1", "auto-test-role2", "empty"
    Then the user views topic type editor for "autotest-topicType"
    When the user enters "auto-test-role2" as admin roles, "auto-test-role1" as commenter roles, "auto-test-role3" as reader roles
    And the user clicks Save button on topic type editor
    Then the user "views" the topic type of "autotest-topicType", "auto-test-role2", "auto-test-role1", "auto-test-role3"
    # Delete
    When the user clicks "Delete" button for the topic type of "autotest-topicType", "auto-test-role2", "auto-test-role1", "auto-test-role3"
    Then the user views delete "topic type" confirmation modal for "autotest-topicType"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the topic type of "autotest-topicType", "auto-test-role2", "auto-test-role1", "auto-test-role3"