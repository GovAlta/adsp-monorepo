@directory-service
Feature: Directory-service

  @TEST_CS-1104 @REQ_CS-1091 @regression
  Scenario Outline: As a tenant admin, I can see the Directory service overview and service entries
    Given a tenant admin user is on tenant admin page
    When the user selects the "Directory" menu item
    Then the user views the "Directory service" overview content "The directory service is a register of services and their APIs"
    Then the user views the aside item "Support" with the aside item link "Get support"
    When the user selects "Entries" tab for "Directory"
    Then the user views the service entry of "<Directory Name>" and "<URL>"
    Examples:
      | Directory Name | URL          |
      | file-service   | env{fileApi} |

  @TEST_CS-1294 @REQ_CS-1095 @regression
  Scenario: As a tenant admin, I can add/edit/delete directory entries in a tenant namespace
    Given a tenant admin user is on directory entries page
    # Add a service entry
    When the user clicks Add entry button
    Then the user "views" Add entry modal
    When the user enters "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    And the user clicks Save button in Entry modal
    And the user "should not view" Add entry modal
    Then the user "views" the entry of "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    # # The new shadow dom button component doesn't click to show the error message. Ignore invalid input test steps
    # # Test input field restriction
    # When the user clicks Add entry button
    # Then the user "views" Add entry modal
    # When the user enters "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    # And the user clicks Save button in Entry modal
    # Then the user views the error message "Service duplicate, please use another" for "Service" field
    # When the user enters "autotest-nameUpperCase" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    # Then the user views the error message "Allowed characters are: a-z, 0-9, -" for "Service" field
    # When the user enters "autotest-apinaming" in Service, "V2" in API, "https://myServiceEntry.com" in URL
    # Then the user views the error message "Allowed characters are: a-z, 0-9, -" for "Api" field
    # When the user enters "autotest-apinaming" in Service, "Empty" in API, "myServiceEntryFormat" in URL
    # Then the user views the error message "Please enter a valid URL" for "Url" field
    # When the user clicks Cancel button in Entry modal
    # Then the user "should not view" the entry of "autotest-apinaming" in Service, "Empty" in API, "myServiceEntryFormat" in URL
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

  @TEST_CS-1468 @REQ_CS-1095 @regression
  Scenario: As a tenant admin, I can add/delete service API entries in a tenant namespace
    Given a tenant admin user is on directory entries page
    When the user clicks Add entry button
    Then the user "views" Add entry modal
    When the user enters "autotest-api" in Service, "v2" in API, "https://myServiceEntry.ca" in URL
    And the user clicks Save button in Entry modal
    Then the user "views" the entry of "autotest-api" in Service, "v2" in API, "https://myServiceEntry.ca" in URL
    # # The new shadow dom button component doesn't click to show the error message. Ignore invalid input test steps
    # # Test validation for Api entry duplication
    # When the user clicks Add entry button
    # Then the user "views" Add entry modal
    # When the user enters "autotest-api" in Service, "v2" in API, "https://myServiceEntry.ca" in URL
    # And the user clicks Save button in Entry modal
    # Then the user views the error message "Api duplicate, please use another" for "Api" field
    # When the user clicks Cancel button in Entry modal
    And the user clicks Delete icon of "autotest-api", "v2", "https://myServiceEntry.ca" on entries page
    Then the user views Delete entry modal for "autotest-api:v2"
    When the user clicks Delete button in Entry modal
    Then the user "should not view" the entry of "autotest-api" in Service, "v2" in API, "https://myServiceEntry.ca" in URL

  @TEST_CS-1399 @REQ_CS-1227 @regression
  Scenario: As a tenant admin, when I add directory entries, I can select from APIs resolved via service metadata, so I have a quick way to add API entries
    Given a tenant admin user is on directory entries page
    When the user clicks Eye icon for the service entry of "automatedtest-use-only"
    Then the user views the metadata of service for "automatedtest-use-only"
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

  @TEST_CS-1464 @REQ_CS-1318 @regression
  Scenario: As a tenant admin, I can see the event definitions for directory service, so I know what events are available
    # Create and update a service api entry
    Given a tenant admin user is on directory entries page
    When the user clicks Add entry button
    Then the user "views" Add entry modal
    When the user enters "autotest-test-event" in Service, "v1" in API, "https://myServiceEntry.com/v1" in URL
    And the user clicks Save button in Entry modal
    Then the user "views" the entry of "autotest-test-event" in Service, "v1" in API, "https://myServiceEntry.com/v1" in URL
    When the user clicks Edit icon of "autotest-test-event", "v1", "https://myServiceEntry.com/v1" on entries page
    Then the user views Edit entry modal
    When the user modifies URL field "https://myServiceEntry-2.ca/v1"
    And the user clicks Save button in Entry modal
    Then the user "views" the entry of "autotest-test-event" in Service, "v1" in API, "https://myServiceEntry-2.ca/v1" in URL
    # Check update directory entry event log
    When the user waits "20" seconds
    And the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "directory-service:entry-updated", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    Then the user views the events matching the search filter of "directory-service:entry-updated"
    When the user clicks Show details button for the latest event of "entry-updated" for "directory-service"
    Then the user views the event details of "autotest-test-event", "v1", "https://myServiceEntry-2.ca/v1", "autotest", "Auto Test"
    # Delete the directory entry
    When the user selects the "Directory" menu item
    And the user selects "Entries" tab for "Directory"
    And the user clicks Delete icon of "autotest-test-event", "v1", "https://myServiceEntry-2.ca/v1" on entries page
    Then the user views Delete entry modal for "autotest-test-event:v1"
    When the user clicks Delete button in Entry modal
    Then the user "should not view" the entry of "autotest-test-event" in Service, "v1" in API, "https://myServiceEntry-2.ca/v1" in URL
    # Check the event log for entry deleted from directory service
    When the user waits "20" seconds
    And the user selects the "Event log" menu item
    Then the "Event log" landing page is displayed
    When the user searches with "directory-service:entry-deleted", "now-2mins" as minimum timestamp, "now+2mins" as maximum timestamp
    Then the user views the events matching the search filter of "directory-service:entry-deleted"
    When the user clicks Show details button for the latest event of "entry-deleted" for "directory-service"
    Then the user views the event details of "autotest-test-event", "v1", "https://myServiceEntry-2.ca/v1", "autotest", "Auto Test"

  @TEST_CS-1241 @REQ_CS-1094 @regression @api
  Scenario:  As a developer, I can access the directory via its API, so I can lookup specific service URLs.
    When the user sends an anonymous request to directory service to get all "autotest" tenant service entries
    Then the user receives response with all services and their URLs for "autotest"

  @accessibility @regression
  Scenario: As a tenant admin, I can use directory pages without any critical or serious accessibility issues
    Given a tenant admin user is on tenant admin page
    When the user selects the "Directory" menu item
    Then no critical or serious accessibility issues on "directory overview page"
    When the user selects "Entries" tab for "Directory"
    Then no critical or serious accessibility issues on "directory entries page"
    When the user clicks Add entry button
    Then the user "views" Add entry modal
    And no critical or serious accessibility issues for "directory entry modal" on "directory entries page"
    When the user clicks Cancel button in Entry modal
    Then the user "should not view" Add entry modal

  @TEST_CS-4002 @REQ_CS-3616 @TEST_CS-4018 @REQ_CS-3618 @TEST_CS-4017 @REQ_CS-3617 @TEST_CS-3988 @REQ_CS-3615 @regression
  Scenario:  As a tenant admin, I can add/edit/delete/view configured resources types
    Given a tenant admin user is on resource types page
    # Add a resource type
    When the user clicks Add type button on resource types page
    Then the user "views" Add resource type modal
    And the user views Api, Type and Matcher fields having required label in resource type modal
    When the user enters "urn:ads:autotest:autotest-resource-types:api", "auto-test", "Child Service", "autotest-namepath", "Autotest:autotest-eventDefinition" in resource type modal
    Then the user views the error message of "Matcher is invalid for regular expression." for Matcher field in resource type modal
    When the user enters "urn:ads:autotest:autotest-resource-types:api", "auto-test", "^Child Service .+", "autotest-namepath", "Autotest:autotest-eventDefinition" in resource type modal
    When the user enters "urn:ads:autotest:autotest-resource-types:api", "auto-test", "^Child Service .+", "autotest-namepath", "Autotest:autotest-eventDefinition" in resource type modal
    And the user clicks Cancel button in resource type modal
    Then the user "should not view" the entry of "urn:ads:autotest:autotest-resource-types:api", "auto-test", "^Child Service .+" on resource types page
    When the user clicks Add type button on resource types page
    Then the user "views" Add resource type modal
    When the user enters "urn:ads:autotest:autotest-resource-types:api", "auto-test", "^Child Service .+", "autotest-namepath", "Autotest:autotest-eventDefinition" in resource type modal
    And the user clicks Save button in resource type modal
    Then the user "views" the entry of "urn:ads:autotest:autotest-resource-types:api", "auto-test", "^Child Service .+" on resource types page
    When the user clicks "eye" icon of "urn:ads:autotest:autotest-resource-types:api", "auto-test", "^Child Service .+" on resource types page
    Then the user views "autotest-namepath", "Autotest:autotest-eventDefinition" in the details view of the resource type of "urn:ads:autotest:autotest-resource-types:api", "auto-test", "^Child Service .+" on resource types page
    # Edit a resource type
    When the user clicks "edit" icon of "urn:ads:autotest:autotest-resource-types:api", "auto-test", "^Child Service .+" on resource types page
    Then the user "views" Edit resource type modal
    And the user views Api dropdown is disabled in resource type modal
    When the user enters "N/A", "auto-test-new", "^Land Title .+", "autotest-namepath-new", "autotest-DO-NOT-DELETE" in resource type modal
    And the user clicks Cancel button in resource type modal
    Then the user "should not view" the entry of "urn:ads:autotest:autotest-resource-types:api", "auto-test-new", "^Land Title .+" on resource types page
    When the user clicks "edit" icon of "urn:ads:autotest:autotest-resource-types:api", "auto-test", "^Child Service .+" on resource types page
    And the user enters "N/A", "auto-test-new", "^Land Title .+", "autotest-namepath-new", "autotest-DO-NOT-DELETE" in resource type modal
    And the user clicks Save button in resource type modal
    Then the user "views" the entry of "urn:ads:autotest:autotest-resource-types:api", "auto-test-new", "^Land Title .+" on resource types page
    When the user clicks "eye" icon of "urn:ads:autotest:autotest-resource-types:api", "auto-test-new", "^Land Title .+" on resource types page
    Then the user views "autotest-namepath-new", "autotest-DO-NOT-DELETE" in the details view of the resource type of "urn:ads:autotest:autotest-resource-types:api", "auto-test-new", "^Land Title .+" on resource types page
    When the user clicks "edit" icon of "urn:ads:autotest:autotest-resource-types:api", "auto-test-new", "^Land Title .+" on resource types page
    Then the user "views" Edit resource type modal
    # Delete a resource type
    When the user clicks "delete" icon of "urn:ads:autotest:autotest-resource-types:api", "auto-test-new", "^Land Title .+" on resource types page
    Then the user views delete "resource type" confirmation modal for "auto-test-new"
    When the user clicks Cancel button in delete confirmation modal
    Then the user "views" the entry of "urn:ads:autotest:autotest-resource-types:api", "auto-test-new", "^Land Title .+" on resource types page
    When the user clicks "delete" icon of "urn:ads:autotest:autotest-resource-types:api", "auto-test-new", "^Land Title .+" on resource types page
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the entry of "urn:ads:autotest:autotest-resource-types:api", "auto-test-new", "^Land Title .+" on resource types page