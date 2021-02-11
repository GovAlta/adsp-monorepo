Feature: Tenant Management API

    @smoke-test @regression @api
    Scenario: Tenant Management App Health Check
        When the user sends a request to tenant management health endpoint
        Then the user receives response with application uptime