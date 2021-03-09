Feature: Tenant management welcome page

    @smoke-test @regression
    Scenario: As a tenant management user, I can see the welcome page
        When the user goes to the tenant management welcome page
        Then the user views the tenant management welcome page title

    @regression @ignore
    Scenario: As a tenant management user, I can log in tenant management web app
        Given the user is on the tenant management welcome page
        When the user clicks the sign in button
        And the user enters credentials and clicks login button
        Then the user is logged in tenant admin site