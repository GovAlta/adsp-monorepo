@task
Feature: Task

  # Bug #: CS-4368 tasks tab shows a blank page with console errors
  @TEST_CS-2391 @TEST_CS-2397 @TEST_CS-2433 @TEST_CS-2408 @TEST_CS-2350 @REQ_CS-1748 @REQ_CS-1749 @REQ_CS-1750 @regression @ignore
  Scenario: As a tenant admin, I can add and delete a task queue
    Given a tenant admin user is on task service overview page
    When the user clicks Add queue button on task service overview page
    Then the user views Add queue modal
    When the user clicks Cancel button in Add queue modal
    Then the user views Queues page
    # Invalid data
    When the user clicks Add queue button on Queues page
    When the user enters "autotest", "auto-test-1-$" in Add queue modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" for Name field in Add queue modal
    # Validate data
    When the user enters "autotest", "addEditDeleteQueue" in Add queue modal
    And the user clicks Save button in Add queue modal
    Then the user views Queue page for "autotest", "addEditDeleteQueue"
    When the user enters "auto-test-role1" as Assigner roles and "empty" as Worker roles
    And the user clicks Save button on Queue page
    And the user clicks Back button on Queue page
    Then the user "views" the queue of "autotest", "addEditDeleteQueue"
    # Edit and back
    When the user clicks "Edit" button for the queue of "autotest", "addEditDeleteQueue"
    Then the user views Queue page for "autotest", "addEditDeleteQueue"
    When the user enters "auto-test-role2" as Assigner roles and "auto-test-role2, urn:ads:autotest:chat-service:chat-admin" as Worker roles
    And the user clicks Back button on Queue page
    And the user clicks "Don't save" button on unsaved changes modal
    Then the user "views" the queue of "autotest", "addEditDeleteQueue"
    # Edit and save
    When the user clicks "Edit" button for the queue of "autotest", "addEditDeleteQueue"
    Then the user views Queue page for "autotest", "addEditDeleteQueue"
    When the user enters "auto-test-role2" as Assigner roles and "auto-test-role2, urn:ads:autotest:chat-service:chat-admin" as Worker roles
    And the user clicks Save button on Queue page
    And the user clicks Back button on Queue page
    Then the user "views" the queue of "autotest", "addEditDeleteQueue"
    # Delete
    When the user clicks "Delete" button for the queue of "autotest", "addEditDeleteQueue"
    Then the user views delete "task queue" confirmation modal for "addEditDeleteQueue"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the queue of "autotest", "addEditDeleteQueue"

  @TEST_CS-2296 @REQ_CS-1747 @regression
  Scenario: As a tenant admin, I can see the overview for a task service, so I know about it
    Given a tenant admin user is on task service overview page
    Then the user views the "Task service" overview content "The task service provides"
    And the user views the link of API docs for "Task service"
    And the user views the link of See the code for "task-service"
    And the user views the link of "Get support" under Support

  # Ignore the test for now as the copy link icon has accessibility issue
  #TEST DATA: precreated queue of "autotest", "accessibility-test", "auto-test-role1", "auto-test-role1"
  @accessibility @regression @ignore
  Scenario: As a tenant admin, I can use task pages without any critical or serious accessibility issues
    Given a tenant admin user is on task service overview page
    Then no critical or serious accessibility issues on "task overview page"
    When the user clicks Add queue button on task service overview page
    Then the user views Add queue modal
    And no critical or serious accessibility issues on "task add queue page"
    When the user clicks Cancel button in Add queue modal
    Then the user views Queues page
    And no critical or serious accessibility issues on "task queues page"
    When the user clicks "Edit" button for the queue of "autotest", "accessibility-test"
    Then the user views Queue page for "autotest", "accessibility-test"
    And no critical or serious accessibility issues on "task queue editor page"