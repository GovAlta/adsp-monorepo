@pdf-service
Feature: Pdf service

    @TEST_CS-1400 @REQ_CS-1359 @regression
    Scenario: As a tenant admin, I can see a PDF service overview, so I know about the service
        Given a tenant admin user is on Pdf service overview page
        Then the user views the "PDF service" overview content "The PDF service provides"
        And the user views the link of API docs for "PDF Service"
        And the user views the link of See the code for "pdf-service"
        And the user views the link of "Get support" under Support

