@directory-service
Feature: Directory-service

  @TEST_CS-1104 @REQ_CS-1091, @regression
  Scenario Outline: As a tenant admin, I can see the Directory service overview and service entries
    Given a tenant admin user is on tenant admin page
    When the user selects the "Directory" menu item
    Then the user views the Directory service overview content "The directory service is a register of services and their APIs"
    Then the user views the aside item "Support" with the aside item link "Get support"
    When the user selects "Entries" tab for "Directory"
    Then the user views the service entry of "<Directory Name>" and "<URL>"
    Examples:
      | Directory Name | URL          |
      | file-service   | env{fileApi} |

  @TEST_CS-1294 @REQ_CS-1095, @regression
  Scenario: As a tenant admin, I can add/edit/delete directory entries in a tenant namespace
    Given a tenant admin user is on directory entries page
    # Add a service entry
    When the user clicks Add entry button
    Then the user "views" Add entry modal
    When the user enters "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    And the user clicks Save button in Entry modal
    And the user "should not view" Add entry modal
    Then the user "views" the entry of "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    # Test input field restriction
    When the user clicks Add entry button
    Then the user "views" Add entry modal
    When the user enters "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    And the user clicks Save button in Entry modal
    Then the user views the error message "Service duplicate, please use another" for "Service" field
    When the user enters "autotest-nameUpperCase" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    Then the user views the error message "Allowed characters are: a-z, 0-9, -" for "Service" field
    When the user enters "autotest-apinaming" in Service, "V2" in API, "https://myServiceEntry.com" in URL
    Then the user views the error message "Allowed characters are: a-z, 0-9, -" for "Api" field
    When the user enters "autotest-apinaming" in Service, "Empty" in API, "myServiceEntryFormat" in URL
    Then the user views the error message "Please enter a valid URL" for "Url" field
    When the user clicks Cancel button in Entry modal
    Then the user "should not view" the entry of "autotest-apinaming" in Service, "Empty" in API, "myServiceEntryFormat" in URL
    # Edit a service entry, only url is editable
    When the user clicks Edit icon of "autotest-addentry", "Empty", "https://myServiceEntry.com" on entries page
    Then the user views Edit entry modal
    When the user modifies URL field "https://myServiceEntry-2.ca"
    And the user clicks Save button in Entry modal
    Then the user "views" the entry of "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry-2.ca" in URL
    # Delete a service entry
    When the user clicks Delete icon of "autotest-addentry", "Empty", "https://myServiceEntry-2.ca" on entries page
    Then the user views Delete entry modal for "autotest-addentry"
    When the user clicks Delete button in Entry modal
    Then the user "should not view" the entry of "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry-2.ca" in URL

  @TEST_CS-1468 @REQ_CS-1095, @regression
  Scenario: As a tenant admin, I can add/edit/delete service API entries in a tenant namespace
    Given a tenant admin user is on directory entries page
    When the user clicks Add entry button
    Then the user "views" Add entry modal
    When the user enters "autotest-api" in Service, "v2" in API, "https://myServiceEntry.ca" in URL
    And the user clicks Save button in Entry modal
    Then the user "views" the entry of "autotest-api" in Service, "v2" in API, "https://myServiceEntry.ca" in URL
    # Test validation for Api entry duplication
    When the user clicks Add entry button
    Then the user "views" Add entry modal
    When the user enters "autotest-api" in Service, "v2" in API, "https://myServiceEntry.ca" in URL
    And the user clicks Save button in Entry modal
    Then the user views the error message "Api duplicate, please use another" for "Api" field
    When the user clicks Cancel button in Entry modal
    And the user clicks Delete icon of "autotest-api", "v2", "https://myServiceEntry.ca" on entries page
    Then the user views Delete entry modal for "autotest-api:v2"
    When the user clicks Delete button in Entry modal
    Then the user "should not view" the entry of "autotest-api" in Service, "v2" in API, "https://myServiceEntry.ca" in URL

  @TEST_CS-1399 @REQ_CS-1227, @regression
  Scenario: As a tenant admin, when I add directory entries, I can select from APIs resolved via service metadata, so I have a quick way to add API entries
    Given a tenant admin user is on directory entries page
    When the user clicks Eye icon for the service entry of "automatedtest-use-only"
    Then the user views the metadata
    When the user clicks Eye icon to close metadata for the service entry of "automatedtest-use-only"
    And the user clicks on Add from the action menu
    Then the user "views" Add entry modal
    And the user views disabled inputs for Service, API and URL fields
    And the user clicks Save button in Entry modal
    Then the user "views" the entry of "automatedtest-use-only" in Service, "v1" in API, "https://file-service.adsp-uat.alberta.ca/file/v1" in URL
    When the user clicks Delete icon of "automatedtest-use-only", "v1", "https://file-service.adsp-uat.alberta.ca/file/v1" on entries page
    Then the user views Delete entry modal for "automatedtest-use-only:v1"
    When the user clicks Delete button in Entry modal
    Then the user "should not view" the entry of "automatedtest-use-only" in Service, "v1" in API, "https://file-service.adsp-uat.alberta.ca/file/v1" in URL
