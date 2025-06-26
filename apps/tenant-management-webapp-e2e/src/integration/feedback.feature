Feature: Feedback

  @TEST_CS-3339 @REQ_CS-3019 @regression
  Scenario: As a tenant admin, I can see feedback overview
    Given a tenant admin user is on tenant admin page
    When the user selects the "Feedback" menu item
    And the user selects "Guidance" tab for "Feedback"
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

  @TEST_CS-3196 @REQ_CS-3031 @REQ_CS-3369 @regression
  Scenario: As a site visitor, I can access and complete a feedback form, so that I can share my feedback
    Given a tenant admin user is on tenant admin page
    When the user clicks the Feedback badge
    Then the user "views" Give feedback start modal
    When the user clicks close icon on Give feedback start modal
    Then the user "should not view" Give feedback start modal
    When the user clicks the Feedback badge
    And the user clicks Start button in Give feedback start modal
    Then the user views 5 emoji ratings in Give feedback main modal
    And the user views optional comments text field
    And the user views a technical issues area
    When the user enters "Easy", "autotest comments", "No", "N/A" in Give feedback main modal
    And the user clicks Cancel button in Give feedback main modal
    Then the user "should not view" Give feedback main modal
    When the user clicks the Feedback badge
    Then the user "views" Give feedback start modal
    And the user clicks Start button in Give feedback start modal
    When the user enters "Easy", "autotest comments", "Yes", "autotest technical issue" in Give feedback main modal
    And the user clicks Submit button in Give feedback main modal
    Then the user views success message for submitting a feedback
    When the user clicks Close button in Give feedback modal
    Then the user "should not view" Give feedback main modal
    And the user "should not view" the Feedback badge
    When the user re-load the page and wait "5" seconds
    Then the user "views" the Feedback badge

  # TEST DATA: https://adsp- site should have more than 10 feedback records
  @TEST_CS-3210 @REQ_CS-3021 @regression
  Scenario: As a tenant admin, I can see feedback sent regarding my sites, so I can review user experience and how to improve my site
    Given a tenant admin user is on Feedback service Feedback page
    Then the user views site URLs from sites page in Registered sites dropdown
    When the user selects the adsp site in Registered sites dropdown
    Then the user views a feedback list with Submitted on, View, Rating, Action
    And the user views a feedback list of 10 ordered from most recent to oldest
    When the user clicks Load more button on the page
    Then the user views more than 10 feedback records on feedback page
    When the user clicks toggle details icon on the latest feedback
    Then the user views feedback details with timestamp, rating, comments, technical issues
