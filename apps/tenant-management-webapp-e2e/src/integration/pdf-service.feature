@pdf-service
Feature: PDF service

  @TEST_CS-1400 @REQ_CS-1359 @regression
  Scenario: As a tenant admin, I can see a PDF service overview, so I know about the service
    Given a tenant admin user is on PDF service overview page
    Then the user views the "PDF service" overview content "The PDF service provides"
    And the user views the link of API docs for "PDF Service"
    And the user views the link of See the code for "pdf-service"
    And the user views the link of "Get support" under Support

  @TEST_CS-1414 @REQ_CS-1360 @regression
  Scenario: As a tenant admin, I can see a list of templates and add templates for PDF generation, so I can define PDF templates
    Given a tenant admin user is on Pdf service overview page
    When the user clicks Add template button
    Then the user views Add template modal
    When the user enters "autotest-addtemplate" as name, "autotest template desc" as description in pdf template modal
    And the user clicks Save button in Add template modal
    Then the user views name "autotest-addtemplate", template id "autotest-addtemplate" and description "autotest template desc" on pdf templates'
# Waiting for Delete function implementation to finish
# When the user clicks Delete icon related to "autotest-addtemplate" template name
# Then the user views Delete pdf modal modal
# And the user views the Delete confirmation message of "autotest-addtemplate"
# When the user clicks Confirm button on Delete pdf template modal
# Then the user "should not view" the template of "autotest-addtemplate"