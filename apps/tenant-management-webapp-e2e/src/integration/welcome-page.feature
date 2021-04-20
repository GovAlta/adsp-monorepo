Feature: Tenant management welcome page

    @smoke-test @regression @smoke-test
    Scenario: As a tenant management user, I can see the welcome page
        When the user goes to the tenant management welcome page
        Then the user views the tenant management welcome page title

    @regression
    Scenario: As a tenant management user, I can log in tenant management web app
        Given the user is on the tenant management welcome page
        When the user clicks the sign in button
        And the user enters credentials and clicks login button
        Then the user is logged in tenant management web app

    @TEST_CS-331 @REQ_CS-370 @regression @tenantSignup
    Scenario: User created a tenant cannot create another tenant
        Given a user who "has" already created a tenant is logged in on the tenant management landing page
        When the user selects get started button
        Then the user views a message of cannot create another tenant

    @TEST_CS-297 @REQ_CS-370 @REQ-CS-193 @regression @tenantSignup
    Scenario: User didn't create a tenant before can create a new tenant
        Given a user who "has not" already created a tenant is logged in on the tenant management landing page
        When the user selects get started button
        Then the user views create tenant page
        When the user enters "autotest-signup" as tenant name and clicks create tenant button
        Then the user views the tenant is successfully created message
        And the new tenant login button is presented
        # Delete the created tenant for the next test run
        When the user sends the delete tenant request for "autotest-signup"
        Then the new tenant is deleted