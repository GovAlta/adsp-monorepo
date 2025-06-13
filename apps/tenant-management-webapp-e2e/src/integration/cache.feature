@cache
Feature: Calendar

  @TEST_CS-4036 @REQ_CS-3620 @regression
  Scenario: As a tenant admin, I can see the cache service overview in tenant admin view
    Given a tenant admin user is on tenant admin page
    When the user selects the "Cache" menu item
    Then the user views the "Cache service" overview content "Cache service provides"
    And the user views "Cache targets" section on cache overview page
    And the user views the link of API docs for "Cache service"
    And the user views the link of See the code for "cache-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-4059 @TEST_CS-4063 @TEST_CS-4083 @TEST_CS-4043 @REQ_CS-3621 @REQ_CS-3622 @REQ_CS-3623 @REQ_CS-3624
  Scenario: As a tenant admin, I can add, edit and delete a cache target
    Given a tenant admin user is on cache overview page
    # Add cache target
    When the user clicks Add cache target button on overview tab
    Then the user views Add target modal
    When the user clicks Cancel button in Add target modal
    Then the user views target table header on targets page
    When the user clicks Add cache target button
    Then the user views Add target modal
    And the user views "900" as the default value for TTL in Add target modal
    And the user views "seconds" as TTL unit in Add target modal
    # Invalid data for duplication
    When the user enters "urn:ads:autotest:autotest-cache-test", "1200" in Add target modal
    And the user clicks Save button in Add target modal
    Then the user views the error message of "Duplicate urn name urn:ads:autotest:autotest-cache-test. Must be unique." in Add target modal
    And the user views Save button is disabled in Add target modal
    # Valid data
    When the user enters "urn:ads:autotest:autotest-cache-test:ttl", "360" in Add target modal
    Then the user views "https://autotest.com/ttl" as read-only value for Url field in Add target modal
    When the user clicks Save button in Add target modal
    Then the user "views" the target of "urn:ads:autotest:autotest-cache-test:ttl", "360"
    # Edit
    When the user clicks "Edit" button for the target of "urn:ads:autotest:autotest-cache-test:ttl", "360"
    Then the user views Edit target modal
    And the user views Target and Url fields are read-only in Edit target modal
    When the user enters "2400" as TTL in Edit target modal
    Then the user clicks Cancel button in Edit target modal
    Then the user "should not view" the target of "urn:ads:autotest:autotest-cache-test:ttl", "2400"
    When the user clicks "Edit" button for the target of "urn:ads:autotest:autotest-cache-test:ttl", "360"
    And the user enters "2400" as TTL in Edit target modal
    And the user clicks Save button in Edit target modal
    Then the user "views" the target of "urn:ads:autotest:autotest-cache-test:ttl", "2400"
    # Delete
    When the user clicks "Delete" button for the target of "urn:ads:autotest:autotest-cache-test:ttl", "2400"
    Then the user views delete "cache target" confirmation modal for "urn:ads:autotest:autotest-cache-test:ttl"
    When the user clicks Cancel button in delete confirmation modal
    Then the user "views" the target of "urn:ads:autotest:autotest-cache-test:ttl", "2400"
    When the user clicks "Delete" button for the target of "urn:ads:autotest:autotest-cache-test:ttl", "2400"
    Then the user views delete "cache target" confirmation modal for "urn:ads:autotest:autotest-cache-test:ttl"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the target of "urn:ads:autotest:autotest-cache-test:ttl", "2400"