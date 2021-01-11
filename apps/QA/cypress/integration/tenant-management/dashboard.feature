@dashboard @regression
Feature: Tenant Management Dashboard

  Scenario: As a User I want to access the Tenant management webapp
    # Given the user is a GoA service owner     // no Given as login is not working yet
    When the user visits the tenant management webapp
    Then the landing page is displayed

  @current-sprint  
  Scenario: As a user I want to access the Administration module
    Given the user is in the tenant management webapp
    When the user selects the "Administration" menu item
    Then the "administration" landing page is displayed

  Scenario: As a user I want to access the File Services module
    Given the user is in the tenant management webapp
    When the user selects the "File Services" menu item
    Then the "file services" landing page is displayed  