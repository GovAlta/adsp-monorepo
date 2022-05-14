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
  Scenario:As a tenant admin, I can add/edit/delete directory entries in a tenant namespace
    Given a tenant admin user is on directory entry page
    # Add a service entry
    When the user clicks Add entry button
    Then the user views Add entry modal
    When the user enters "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    And the user clicks Save button
    Then the user views the entry of "autotest-addentry", "https://myServiceEntry.com"
    # Test uniqueness of a service name
    When the user clicks Add entry button
    Then the user views Add entry modal
    When the user enters "autotest-addentry" in Service, "Empty" in API, "https://myServiceEntry.com" in URL
    And the user clicks Save button
# Then the user views the error message of "autotest-addentry" exists
# # Test input field restriction
# When the user enters "autotest-nameUpperCase", "Empty", "https://myServiceEntryAgain.com"
# And the user clicks Save button
# Then the user views the error message of "Service allowed characters: a-z, 0-9, -" for service name field
# When the user enters "autotest-apinaming", "V2", "https://myServiceEntryAgain.com"
# And the user clicks Save button
# Then the user views the error message of "Api allowed characters: a-z, 0-9, -" for api field
# When the user enters "autotest-urlnaming", "Empty", "https://myServiceEntryAgain"
# And the user clicks Save button
# Then the user views the error message of "Please input right url format" for URL field
# When the user clicks Cancel button
# Then the user should not view Add entry modal
# # Edit a service entry
# When the user clicks "Edit" icon of "autotest-addentry", "https://myServiceEntry.com"
# Then the user views Edit entry modal
# When the user enters "autotest-editentry", "v1", "https://myServiceEntry2.com"
# And the user clicks Save button
# Then the user "views" the entry of "autotest-editentry:v1", "https://myServiceEntry2.com"
# # Delete a service entry
# When the user clicks "Delete" icon of "autotest-editentry:v1", "https://myServiceEntry2.com"
# Then the user views Delete entry modal for "autotest-editentry"
# When the user clicks Delete button
# Then the user "should not view" the entry of "autotest-editentry:v1", "https://myServiceEntry2.com"
