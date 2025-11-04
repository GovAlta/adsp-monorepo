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
    When the user enters "autotest-aedType<$ph>" in Add topic type modal
    And the user clicks Save button in Add topic type modal
    Then the user views topic type editor for "autotest-aedType<$ph>"
    And the user views "Protected A" as default selection for security classification
    And the user views "Public, Protected A, Protected B, Protected C" in Select a security classification dropdown
    When the user enters "skip" as classification, "auto-test-role1" as admin roles, "auto-test-role2" as commenter roles, "empty" as reader roles
    And the user clicks Save button in topic type editor
    And the user clicks Back button in topic type editor
    Then the user "views" the topic type of "autotest-aedType<$ph>", "Protected A"
    # Edit and back
    When the user clicks "Edit" button for the topic type of "autotest-aedType<$ph>", "Protected A"
    Then the user views topic type editor for "autotest-aedType<$ph>"
    When the user enters "Protected B" as classification, "auto-test-role2" as admin roles, "auto-test-role1" as commenter roles, "auto-test-role3" as reader roles
    And the user clicks Back button in topic type editor
    And the user clicks "Don't save" button on unsaved changes modal
    And the user clicks "Edit" button for the topic type of "autotest-aedType<$ph>", "Protected A"
    Then the user views "Protected A" as classification, "auto-test-role1" as admin roles, "auto-test-role2" as commenter roles, "empty" as reader roles
    When the user clicks Back button in topic type editor
    # Edit and save
    When the user clicks "Edit" button for the topic type of "autotest-aedType<$ph>", "Protected A"
    Then the user views topic type editor for "autotest-aedType<$ph>"
    When the user clicks Edit button in topic type editor
    Then the user views Edit topic type modal in topic type editor
    When the user enters "autotest-aedType<$ph>-new" in Edit topic type modal
    And the user clicks Save button in Edit topic type modal
    Then the user views topic type editor for "autotest-aedType<$ph>-new"
    When the user enters "Protected B" as classification, "auto-test-role2" as admin roles, "auto-test-role1" as commenter roles, "auto-test-role3" as reader roles
    And the user clicks Save button in topic type editor
    And the user clicks Back button in topic type editor
    Then the user "views" the topic type of "autotest-aedType<$ph>-new", "Protected B"
    When the user clicks "Edit" button for the topic type of "autotest-aedType<$ph>-new", "Protected B"
    Then the user views "Protected B" as classification, "auto-test-role2" as admin roles, "auto-test-role1" as commenter roles, "auto-test-role3" as reader roles
    And the user clicks Back button in topic type editor
    # Delete
    When the user clicks "Delete" button for the topic type of "autotest-aedType<$ph>-new", "Protected B"
    Then the user views delete topic type confirmation modal for "autotest-aedType<$ph>-new"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the topic type of "autotest-aedType<$ph>-new", "Protected B"

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
  # CS-4519 - 2 serious accessibility issues found for the dropdown on the topic type editor page
  # When the user clicks "Edit" button for the topic type of "autotest-topicTypesAccessibility", "Protected A"
  # Then the user views topic type editor for "autotest-topicTypesAccessibility"
  # And no critical or serious accessibility issues on "comment topic type editor page"

  # TEST DATA: a topic type called "autotest-autoTopicType" is created with more than 10 but less than 20 pre-created topics to test Load more button
  # TEST DATA: a topic called "autotest-submission001" with resource id of "auto-001" under topic type of "autotest-autoTopicType" has more than 10 comments to test Load more button
  @TEST_CS-2655 @TEST_CS-2677 @TEST_CS-2696 @TEST_CS-2692 @TEST_CS-2691 @REQ_CS-2549 @REQ_CS-2535 @REQ_CS-2550 @REQ_CS-2551 @REQ_CS-2536 @regression
  Scenario: As a tenant admin, I can add, view and delete topics and comments
    Given a tenant admin user is on comment service overview page
    When the user selects "Comments" tab for "Comment"
    # Add topic
    And the user selects "autotest-autoTopicType" in Select a topic type dropdown
    Then the user views a topic list
    When the user clicks Add topic type button on comments page
    Then the user views Add topic modal
    When the user enters "autotest-addDeleteTopic", "autotest topic desc", "autotest123" in Add topic modal
    And the user clicks "Cancel" button in Add topic modal
    Then the user "should not view" a topic of "autotest-addDeleteTopic", "autotest123"
    When the user clicks Add topic type button on comments page
    Then the user views Add topic modal
    When the user enters "autotest-addDelTopic<$ph>", "autotest topic desc", "autotest123" in Add topic modal
    And the user clicks "Save" button in Add topic modal
    # View topic with Load more button
    And the user clicks Load more button for topic list
    Then the user views more than 10 topics
    And the user "views" a topic of "autotest-addDelTopic<$ph>", "autotest123"
    When the user clicks "eye" icon for the topic of "autotest-addDelTopic<$ph>", "autotest123"
    Then the user views the description of "autotest topic desc" for the topic of "autotest-addDelTopic<$ph>", "autotest123"
    And the user views the message of No comments found for the topic of "autotest-addDelTopic<$ph>", "autotest123"
    # Add comment
    When the user clicks Add comment button for the topic
    Then the user views Add comment modal
    When the user enters "Comment number one" as comment
    And the user clicks "Cancel" button in Add comment modal
    Then the user "should not view" the comment of "Comment number one"
    When the user clicks Add comment button for the topic
    Then the user views Add comment modal
    When the user enters "Comment number one" as comment
    And the user clicks "Save" button in Add comment modal
    Then the user views "Comment number one" with user info and current timestamp
    # Edit comment
    When the user clicks "edit" icon for the comment of "Comment number one"
    Then the user views Edit comment modal
    When the user enters "Comment number one edited" in Edit comment modal
    And the user clicks Save button in Edit comment modal
    Then the user views "Comment number one edited" with user info and current timestamp
    # Add another comment and check sorting
    When the user clicks Add comment button for the topic
    Then the user views Add comment modal
    When the user enters "Comment number two" as comment
    And the user clicks "Save" button in Add comment modal
    Then the user views "Comment number two" with user info and current timestamp
    And the user views "Comment number two" shows on top of "Comment number one edited"
    # Delete comment
    When the user clicks "delete" icon for the comment of "Comment number two"
    Then the user views Delete comment modal for "Comment number two"
    When the user clicks Delete button in Delete comment modal
    Then the user "should not view" the comment of "Comment number two"
    # Delete topic
    When the user clicks "delete" icon for the topic of "autotest-addDelTopic<$ph>", "autotest123"
    Then the user views Delete topic modal for "autotest-addDelTopic<$ph>"
    And the user views the message of associated comments with "autotest-addDelTopic<$ph>" to be deleted
    When the user clicks Delete button in Delete topic modal
    Then the user "should not view" a topic of "autotest-addDelTopic<$ph>", "autotest123"
    # Load more button for comments
    When the user clicks "eye" icon for the topic of "autotest-submission001", "auto-001"
    Then the user views "10" comments
    When the user clicks View older comments button
    Then the user views more than "10" comments

  @TEST_CS-2765 @REQ_CS-2725 @regression
  Scenario: As a tenant admin, I can see core topic types, so I understand what topics platform services create
    # Validate core topic types
    Given a tenant admin user is on comment service overview page
    When the user selects "Topic types" tab for "Comment"
    Then the user views Core types below the tenant topic types list
    And the user views core types with "Name", "Topic type ID", "Security classification"
    And the user views only eye icon for core topic Types
    # Validate user cannot create a topic type with the same name of a core type
    When the user clicks Add topic type button on topic types page
    Then the user views Add topic type modal
    When the user enters "Form questions" in Add topic type modal
    Then the user views the error message of "Duplicate topicType name Form questions. Must be unique." for Name field in Add topic type modal
    When the user clicks Cancel button in Add topic type modal
    And the user selects "Comments" tab for "Comment"
    # Add and delete topic and comment for the core topic type of form-questions
    And the user selects "form-questions" in Select a topic type dropdown
    When the user clicks Add topic type button on comments page
    Then the user views Add topic modal
    When the user enters "autotest-topic-form-questions", "autotest topic desc", "autotest456" in Add topic modal
    And the user clicks "Save" button in Add topic modal
    When the user clicks "eye" icon for the topic of "autotest-topic-form-questions", "autotest456"
    Then the user views the description of "autotest topic desc" for the topic of "autotest-topic-form-questions", "autotest456"
    And the user views the message of No comments found for the topic of "autotest-topic-form-questions", "autotest456"
    When the user clicks Add comment button for the topic
    Then the user views Add comment modal
    When the user enters "Comment for form questions" as comment
    And the user clicks "Save" button in Add comment modal
    Then the user views "Comment for form questions" with user info and current timestamp
    When the user clicks "delete" icon for the comment of "Comment for form questions"
    Then the user views Delete comment modal for "Comment for form questions"
    When the user clicks Delete button in Delete comment modal
    Then the user "should not view" the comment of "Comment for form questions"
    When the user clicks "delete" icon for the topic of "autotest-topic-form-questions", "autotest456"
    Then the user views Delete topic modal for "autotest-topic-form-questions"
    And the user views the message of associated comments with "autotest-topic-form-questions" to be deleted
    When the user clicks Delete button in Delete topic modal
    Then the user "should not view" a topic of "autotest-topic-form-questions", "autotest456"