@pdf-service
Feature: PDF service

  @TEST_CS-1400 @REQ_CS-1359 @regression
  Scenario: As a tenant admin, I can see a PDF service overview, so I know about the service
    Given a tenant admin user is on PDF service overview page
    Then the user views the "PDF service" overview content "The PDF service provides"
    And the user views the link of API docs for "PDF Service"
    And the user views the link of See the code for "pdf-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-1461 @REQ_CS-1360 @REQ_CS-1361 @REQ_CS-1736 @regression
  Scenario: Test As a tenant admin, I can edit and preview PDF templates, so that I can define the output PDF.
    Given a tenant admin user is on PDF service overview page
    # Add a PDF template
    When the user clicks Add template button
    Then the user views Add template modal
    When the user enters "autotest-pdf-template" as name, "autotest PDF template desc" as description in pdf template modal
    And the user clicks Save button in Add template modal
    Then the user "views" the PDF template of "autotest-pdf-template", "autotest-pdf-template" and "autotest PDF template desc"
    And the user "views" unfilled badge on "autotest-pdf-template", "autotest-pdf-template" and "autotest PDF template desc"
    # # Edit a PDF template
    When the user clicks "Edit" icon of "autotest-pdf-template", "autotest-pdf-template" and "autotest PDF template desc" on PDF templates page
    Then the user views "autotest-pdf-template", "autotest-pdf-template" and "autotest PDF template desc" in PDF template modal
    When the user enters "autotest-pdf-templateNew" as name and "autotest PDF template new desc" as description in PDF template modal
    And the user enters "autotest body {{ data.testVariable }}" for "Body" in PDF template modal
    Then the user views the "PDF" preview of "autotest body "
    When the user enters "autotest header" for "Header" in PDF template modal
    Then the user views the "Header" preview of "autotest header"
    When the user enters "autotest footer" for "Footer" in PDF template modal
    Then the user views the "footer" preview of "autotest footer"
    When the user clicks Save button in PDF template modal
    Then the user "should not view" unfilled badge on "autotest-pdf-template", "autotest-pdf-template" and "autotest PDF template new desc"
    # Delete a PDF template
    When the user clicks "Delete" icon of "autotest-pdf-templateNew", "autotest-pdf-template" and "autotest PDF template new desc" on PDF templates page
    Then the user views Delete PDF template modal for "autotest-pdf-templateNew"
    When the user clicks Confirm button in Delete PDF Template modal
    Then the user "should not view" the PDF template of "autotest-pdf-templateNew", "autotest-pdf-template" and "autotest PDF template new desc"