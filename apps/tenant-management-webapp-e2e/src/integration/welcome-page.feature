Feature: tenant management welcome page
    
    @smoke-test @regression
    Scenario: As a tenant management user, I can see the welcome page
        When the user goes to the tenant management welcome page
        Then the user views the tenant management welcome page title