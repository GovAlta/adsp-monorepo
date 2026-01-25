@pdf-service
Feature: PDF service

  @TEST_CS-1400 @REQ_CS-1359 @regression
  Scenario: As a tenant admin, I can see a PDF service overview, so I know about the service
    Given a tenant admin user is on PDF service overview page
    Then the user views the "PDF service" overview content "The PDF service provides"
    And the user views the link of API docs for "PDF service"
    And the user views the link of See the code for "pdf-service"
    And the user views the link of "Get support" under Support

  ## Edit test steps are commented out due to being failed only in nightly run, but not on local development env or manual testing.
  @TEST_CS-1461 @REQ_CS-1360 @REQ_CS-1361 @REQ_CS-1736 @REQ_CS-1636 @regression @prod
  Scenario: As a tenant admin, I can add, edit, preview and delete a PDF template
    Given a tenant admin user is on PDF service overview page
    # Add a PDF template
    When the user clicks Add template button
    Then the user views Add template modal
    When the user enters "autotest-pdftemplate" as name, "autotest PDF template desc" as description in pdf template modal
    And the user clicks Save button in Add or Edit template modal
    # Edit a PDF template meta data
    When the user clicks the "Header" tab in PDF template editor and view content
    When the user clicks the "Body" tab in PDF template editor and view content
    When the user clicks the "Footer" tab in PDF template editor and view content
    When the user clicks the "CSS" tab in PDF template editor and view content
    When the user clicks the "Test data" tab in PDF template editor and view content
    When the user clicks the "File history" tab in PDF template editor and view content
    Then the user views "No PDF's have been generated yet" in File history
    Then the user views the PDF template editor screen
    Then the user views "autotest-pdftemplate", "autotest-pdftemplate" and "autotest PDF template desc" in PDF template editor
    When the user clicks "Edit" icon in editor screen
    When the user enters "autotest-pdftemplate-new" as name and "autotest PDF template desc new" as description in PDF template modal
    And the user clicks Save button in Add or Edit template modal
    And the user clicks Back button in editor screen
    Then the user "views" the PDF template of "autotest-pdftemplate-new", "autotest-pdftemplate" and "autotest PDF template desc new"
    # Delete a PDF template
    When the user clicks "Delete" icon of "autotest-pdftemplate-new", "autotest-pdftemplate" and "autotest PDF template desc new" on PDF templates page
    Then the user views Delete PDF template modal for "autotest-pdftemplate-new"
    When the user clicks Confirm button in Delete PDF Template modal
    Then the user "should not view" the PDF template of "autotest-pdftemplate-new", "autotest-pdftemplate" and "autotest PDF template desc new"

  @accessibility @regression
  Scenario: As a tenant admin, I can use PDF pages without any critical or serious accessibility issues
    Given a tenant admin user is on PDF service overview page
    Then no critical or serious accessibility issues on "PDF overview page"
    When the user clicks Add template button
    Then the user views Add template modal
    And no critical or serious accessibility issues for "add PDF template modal" on "PDF overview page"
    When the user clicks Cancel button in Add template modal
    Then no critical or serious accessibility issues on "PDF templates page"
    When the user clicks "Edit" icon of "autotest-accessibility-test", "autotest-accessibility-test" and "DO-NOT-DELETE" on PDF templates page
    Then the user views the PDF template editor screen
    Then the user views "autotest-accessibility-test", "autotest-accessibility-test" and "DO-NOT-DELETE" in PDF template editor
    And no critical or serious accessibility issues on "PDF template editor page"

  @TEST_CS-2063 @regression @prod
  Scenario: As a tenant admin, I can edit templates in header, footer,body and CSS section, and generate pdf files.
    Given a tenant admin user is on PDF service templates page
    When the user clicks "Edit" icon of "autotest-generatepdf-test", "autotest-generatepdf-test" and "DO-NOT-DELETE" on PDF templates page
    When the user clicks Generate PDF button in PDF template editor screen
    Then the user can preview pdf file that generated in iframe
    When the user clicks download button in PDF template editor
    When the user clicks the "File history" tab in PDF template editor and view content
    Then the file information is list in table

