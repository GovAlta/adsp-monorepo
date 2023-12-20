@comment
Feature: Comment

  @TEST_CS-2435 @REQ_CS-2399 @regression
  Scenario: As a tenant admin, I can see an overview of the comment service, so I understand what it is used for
    Given a tenant admin user is on comment service overview page
    Then the user views the "Comment service" overview content "Comment services allows"
    And the user views the link of API docs for "Comment service"
    And the user views the link of See the code for "comment-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-2441 @TEST_CS-2440 @TEST_CS-2442 @TEST_CS-2445 @TEST_CS-2524 @REQ_CS-2393 @REQ_CS-2395 @REQ_CS-22396 @REQ_CS-2394 @REQ_CS-2448 @regression
  Scenario: As a tenant admin, I can add, edit and delete a comment topic type with data classification
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
    When the user enters "autotest-aedTopicType" in Add topic type modal
    And the user clicks Save button in Add topic type modal
    Then the user views topic type editor for "autotest-aedTopicType"
    And the user views "Protected A" as default selection for security classification
    And the user views "Public, Protected A, Protected B, Protected C" in Select a security classification dropdown
    When the user enters "skip" as classification, "auto-test-role1" as admin roles, "auto-test-role2" as commenter roles, "empty" as reader roles
    And the user clicks Save button in topic type editor
    Then the user "views" the topic type of "autotest-aedTopicType", "Protected A"
    # Edit and back
    When the user clicks "Edit" button for the topic type of "autotest-aedTopicType", "Protected A"
    Then the user views topic type editor for "autotest-aedTopicType"
    When the user enters "Protected B" as classification, "auto-test-role2" as admin roles, "auto-test-role1" as commenter roles, "auto-test-role3" as reader roles
    And the user clicks Back button in topic type editor
    And the user clicks "Don't save" button on unsaved changes modal
    And the user clicks "Edit" button for the topic type of "autotest-aedTopicType", "Protected A"
    Then the user views "Protected A" as classification, "auto-test-role1" as admin roles, "auto-test-role2" as commenter roles, "empty" as reader roles
    When the user clicks Back button in topic type editor
    # Edit and save
    When the user clicks "Edit" button for the topic type of "autotest-aedTopicType", "Protected A"
    Then the user views topic type editor for "autotest-aedTopicType"
    When the user clicks Edit button in topic type editor
    Then the user views Edit topic type modal in topic type editor
    When the user enters "autotest-aedTopicType-edited" in Edit topic type modal
    And the user clicks Save button in Edit topic type modal
    Then the user views topic type editor for "autotest-aedTopicType-edited"
    When the user enters "Protected B" as classification, "auto-test-role2" as admin roles, "auto-test-role1" as commenter roles, "auto-test-role3" as reader roles
    And the user clicks Save button in topic type editor
    Then the user "views" the topic type of "autotest-aedTopicType-edited", "Protected B"
    When the user clicks "Edit" button for the topic type of "autotest-aedTopicType-edited", "Protected B"
    Then the user views "Protected B" as classification, "auto-test-role2" as admin roles, "auto-test-role1" as commenter roles, "auto-test-role3" as reader roles
    And the user clicks Back button in topic type editor
    # Delete
    When the user clicks "Delete" button for the topic type of "autotest-aedTopicType-edited", "Protected B"
    Then the user views delete "topic type" confirmation modal for "autotest-aedTopicType-edited"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the topic type of "autotest-aedTopicType-edited", "Protected B"

  #TEST DATA: precreated topic type of "autotest-topicTypesAccessibility", "auto-test-role1", "auto-test-role1", "auto-test-role1", "Protected A"
  @accessibility @regression
  Scenario: As a tenant admin, I can use comment pages without any critical or serious accessibility issues
    Given a tenant admin user is on comment service overview page
    Then no critical or serious accessibility issues on "comment overview page"
    When the user clicks Add topic type button on comment service overview page
    Then the user views Add topic type modal
    And no critical or serious accessibility issues on "comment add topic type page"
    When the user clicks Cancel button in Add topic type modal
    Then the user views topic types page
    And no critical or serious accessibility issues on "comment topic types page"
    When the user clicks "Edit" button for the topic type of "autotest-topicTypesAccessibility", "Protected A"
    Then the user views topic type editor for "autotest-topicTypesAccessibility"
    And no critical or serious accessibility issues on "comment topic type editor page"
