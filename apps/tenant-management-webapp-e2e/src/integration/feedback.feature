Feature: Feedback

  @TEST_CS-3339 @REQ_CS-3019 @regression
  Scenario: As a tenant admin, I can see feedback overview
    Given a tenant admin user is on tenant admin page
    When the user selects the "Feedback" menu item
    Then the user views "description" section on feedback overview page
    And the user views "Sites" section on feedback overview page
    And the user views "Feedback widget" section on feedback overview page

  @TEST_CS-3119 @TEST_CS-3169 @TEST_CS-3165 @REQ_CS-3020 @REQ_CS-3022 @REQ_CS-3023 @regression
  Scenario: As a tenant admin, I can add, edit and delete sites to the feedback service configuration
    Given a tenant admin user is on Feedback Sites page
    # Add a site
    When the user clicks Register site button on Sites page
    Then the user "views" Register site modal
    And the user views the checkbox of Allow anonymous feedback is unchecked
    And the user views the hint text of "Enabling anonymous feedback may result in lower quality feedback."
    When the user enters "https://mytest.com", "Yes" in Register site modal
    And the user clicks Register button in Register site modal
    Then the user "views" "https://mytest.com", "Yes" on Sites page
    # Add a site with duplicate name
    When the user clicks Register site button on Sites page
    Then the user "views" Register site modal
    When the user enters "https://mytest.com", "No" in Register site modal
    Then the user views Register button is disabled in Register site modal
    And the user views error message "Duplicate url name https://mytest.com. Must be unique." for Site URL in Register site modal
    # Site with invalid name
    When the user enters "mytest.com", "No" in Register site modal
    Then the user views error message "Please enter a valid URL" for Site URL in Register site modal
    # Add another site with Cancel button
    When the user enters "https://abctest.com", "No" in Register site modal
    And the user clicks Cancel button in site modal
    Then the user "should not view" "https://abctest.com", "No" on Sites page
    When the user clicks Register site button on Sites page
    Then the user "views" Register site modal
    When the user enters "https://abctest.com", "No" in Register site modal
    And the user clicks Register button in Register site modal
    Then the user "views" "https://abctest.com", "No" on Sites page
    And the user views the site of "https://abctest.com", "No" is listed before the site of "https://mytest.com", "Yes"
    # Edit a site with Cancel button
    When the user clicks "Edit" button for the site of "https://mytest.com", "Yes"
    Then the user views Edit registered site modal
    And the user views Site URL field is disabled
    And the user views "https://mytest.com" as Site URL value
    When the user enters "No" for the checkbox of Allow anoymous feedback in Edit registered site
    And the user clicks Cancel button in site modal
    Then the user "should not view" "https://mytest.com", "No" on Sites page
    When the user clicks "Edit" button for the site of "https://mytest.com", "Yes"
    Then the user views Edit registered site modal
    When the user enters "No" for the checkbox of Allow anoymous feedback in Edit registered site
    And the user clicks Save button in Edit registered site modal
    Then the user "views" "https://mytest.com", "No" on Sites page
    # Delete sites
    When the user clicks "Delete" button for the site of "https://mytest.com", "No"
    Then the user views delete "registered site" confirmation modal for "https://mytest.com"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" "https://mytest.com", "No" on Sites page
    When the user clicks "Delete" button for the site of "https://abctest.com", "No"
    Then the user views delete "registered site" confirmation modal for "https://abctest.com"
    When the user clicks Cancel button in delete confirmation modal
    Then the user "views" "https://abctest.com", "No" on Sites page
    When the user clicks "Delete" button for the site of "https://abctest.com", "No"
    Then the user views delete "registered site" confirmation modal for "https://abctest.com"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" "https://abctest.com", "No" on Sites page



