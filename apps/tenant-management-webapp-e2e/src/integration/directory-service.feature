@directory-service
Feature: Directory-service

  @TEST_CS-1104 @REQ_CS-1091, @regression
  Scenario Outline: As a tenant admin, I can see the Directory service overview and service entries
    Given a tenant admin user is on tenant admin page
    When the user selects the "Directory" menu item
    Then the user views the Directory service overview content "The directory service is a registry of services and their APIs"
    And the user views the Overview aside item "Support"
    And the user views the Overview aside item with link "Get support"
    When the user selects "Services" tab for "Directory"
    Then the user views the service entry of "<Directory Name>" and "<URL>"
    Examples:
      | Directory Name | URL          |
      | file-service   | env{fileApi} |