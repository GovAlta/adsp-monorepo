Feature: Value

  @TEST_CS-3384 @REQ_CS-2898 @regression
  Scenario: As a tenant admin, I can see value overview
    Given a tenant admin user is on tenant admin page
    When the user selects the "Value" menu item
    Then the user views the "Value service" overview content "The value service provides"

  # CS-4536 Monaco editor bug to be resolved before enabling the test again
  @TEST_CS-3340 @TEST_CS-3387 @3489 @TEST_CS-3434 @REQ_CS-250 @REQ_CS-2899 @REQ_CS-3465 @REQ_CS-3434 @regression @ignore
  Scenario: As a tenant admin, I can add, edit and delete value definitions
    Given a tenant admin user is on value overview page
    # Add value definition
    When the user clicks Add definition button on value service overview page
    Then the user views Add value definition modal
    And the user is on "Definitions" tab of value service
    When the user clicks Add definition button on value definitions page
    Then the user views Add value definition modal
    And the user views Save button being "disabled"
    When the user enters "autotest", "addEditDeleteValueDef", "N/A", "N/A" in value definition modal
    Then the user views Save button being "enabled"
    When the user enters "autotest", "addEditDeleteValueDef", "autotest desc", "{\"autotest-*\": {\"id\": \"autotest-*\", \"name\": \"autotest-*\", \"description\": \"test\"}}" in value definition modal
    And the user clicks Cancel button in value definition modal
    Then the user "should not view" the value definition of "autotest", "addEditDeleteValueDef", "autotest desc"
    When the user clicks Add definition button on value definitions page
    Then the user views Add value definition modal
    When the user enters "autotest", "addEditDeleteValueDef", "autotest desc", "{\"autotest-*\": {\"id\": \"autotest-*\", \"name\": \"autotest-*\", \"description\": \"test\"}}" in value definition modal
    And the user clicks Save button in value definition modal
    Then the user "views" the value definition of "autotest", "addEditDeleteValueDef", "autotest desc"
    When the user clicks Add definition button on value definitions page
    Then the user views Add value definition modal
    When the user enters "autotest", "addEditDeleteValueDef", "autotest desc", "{\"autotest-*\": {\"id\": \"autotest-*\", \"name\": \"autotest-*\", \"description\": \"test\"}}" in value definition modal
    And the user clicks Save button in value definition modal
    Then the user views a validation error of duplicate value name
    When the user clicks Cancel button in value definition modal
    # Edit value definition
    When the user clicks "edit" button of the value definition of "autotest", "addEditDeleteValueDef", "autotest desc"
    Then the user views Edit value definition modal
    And the user views namespace and name fields are read-only
    When the user enters "N/A", "N/A", "autotest desc modified", "{\"autotest-*\": {\"id\": \"autotest-*\", \"name\": \"autotest-*\", \"description\": \"test2\"}}" in value definition modal
    And the user clicks Cancel button in value definition modal
    Then the user "should not view" the value definition of "autotest", "addEditDeleteValueDef", "autotest desc modified"
    When the user clicks "edit" button of the value definition of "autotest", "addEditDeleteValueDef", "autotest desc"
    Then the user views Edit value definition modal
    When the user enters "N/A", "N/A", "autotest desc modified", "{\"autotest-*\": {\"id\": \"autotest-*\", \"name\": \"autotest-*\", \"description\": \"test2\"}}" in value definition modal
    And the user clicks Save button in value definition modal
    Then the user "views" the value definition of "autotest", "addEditDeleteValueDef", "autotest desc modified"
    When the user clicks "eye" button of the value definition of "autotest", "addEditDeleteValueDef", "autotest desc modified"
    Then the user views the payload schema containing "\"description\": \"test2\"" for the value definition of "autotest", "addEditDeleteValueDef", "autotest desc modified"
    # Delete value definition
    When the user clicks "delete" button of the value definition of "autotest", "addEditDeleteValueDef", "autotest desc modified"
    Then the user views delete "value definition" confirmation modal for "addEditDeleteValueDef"
    When the user clicks Cancel button in delete confirmation modal
    Then the user "views" the value definition of "autotest", "addEditDeleteValueDef", "autotest desc modified"
    When the user clicks "delete" button of the value definition of "autotest", "addEditDeleteValueDef", "autotest desc modified"
    Then the user views delete "value definition" confirmation modal for "addEditDeleteValueDef"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the value definition of "autotest", "addEditDeleteValueDef", "autotest desc modified"

  @TEST_CS-3387 @REQ_CS-2899 @regression @prod
  Scenario: As a tenant admin, I can see core value definitions
    Given a tenant admin user is on value overview page
    When the user selects "Definitions" tab for "Value"
    # Validate no duplicate name as core definition name is allowed
    When the user clicks Add definition button on value definitions page
    Then the user views Add value definition modal
    When the user enters "comment-service", "service-metrics", "Low level metrics of the service.", "N/A" in value definition modal
    And the user clicks Save button in value definition modal
    Then the user views a validation error of duplicate value name
    When the user clicks Cancel button in value definition modal
    # Validate core value definitions heading
    Then the user views "cache-service" namespace under Core definitions heading
    # Validate buttons for core value definitions
    And the user "should not view" "edit" button of the core value definition of "calendar-service", "service-metrics", "Low level metrics of the service."
    And the user "should not view" "delete" button of the core value definition of "form-service", "service-metrics", "Low level metrics of the service."
    And the user "views" "eye" button of the core value definition of "pdf-service", "service-metrics", "Low level metrics of the service."

  @TEST_CS-4226 @regression
  Scenario: As a developer, I can use value service to get events with different intervals
    When a developer sends a value service get events request with "<Request endpoint>", "<Request Type>" and "<Interval>" for the last "<Hours>" hours
    Then "<Status Code>" is returned with top 5 events in the response

    Examples:
      | Request endpoint                                                       | Request Type | Interval     | Hours | Status Code |
      | /value/v1/event-service/values/event/metrics?interval=<interval>&top=5 | GET          | one_minute   | 5     | 200         |
      | /value/v1/event-service/values/event/metrics?interval=<interval>&top=5 | GET          | five_minutes | 10    | 200         |
      | /value/v1/event-service/values/event/metrics?interval=<interval>&top=5 | GET          | hourly       | 24    | 200         |
      | /value/v1/event-service/values/event/metrics?interval=<interval>&top=5 | GET          | daily        | 96    | 200         |
      | /value/v1/event-service/values/event/metrics?interval=<interval>&top=5 | GET          | weekly       | 336   | 200         |