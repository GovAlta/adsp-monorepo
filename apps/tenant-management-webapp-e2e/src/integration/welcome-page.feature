@welcome-page
Feature: Tenant management welcome page

    @smoke-test @regression
    Scenario: As a tenant management user, I can see the welcome page
        When the user goes to the tenant management welcome page
        Then the user views the tenant management welcome page title

    @regression
    Scenario Outline: As a tenant management user, I can log in tenant management web app
        Given the user is on the tenant management welcome page
        When the user clicks the sign in button
        And the user enters "<Username>" and "<Password>", and clicks login button
        Then the user views the page of "<Page>" based on if the user created a tenant before or not

        Examples:
            | Username    | Password       | Page            |
            | env{email}  | env{password}  | Tenant Login    |
            | env{email2} | env{password2} | Tenant Creation |

    # TEST DATA: a user has created a tenant before
    @TEST_CS-331 @REQ_CS-370 @regression @tenant-signup
    Scenario: User created a tenant cannot create another tenant
        Given the user is on the tenant management welcome page
        When the user selects get started button
        And the user clicks Sign in button
        And the user enters "env{email}" and "env{password}", and clicks login button
        Then the user views a message of cannot create another tenant

    # TEST DATA: a user has beta-test role, but never created a tenant before
    # TEST DATA: the core api user needs tenant-service-admin role to delete a tenant
    @TEST_CS-297 @REQ_CS-370 @REQ-CS-193 @regression @tenant-signup
    Scenario: User didn't create a tenant before can create a new tenant
        Given the user is on the tenant management welcome page
        When the user selects get started button
        And the user clicks Sign in button
        And the user enters "env{email2}" and "env{password2}", and clicks login button
        Then the user views create tenant page
        When the user enters "autotest signup" as tenant name, clicks create tenant button and waits "30" seconds
        Then the user views the tenant is successfully created message
        And the new tenant login button is presented
        When the user clicks the tenant login button
        Then the user views the tenant login page
        # Delete the created tenant for the next test run
        When the user sends the delete tenant request
        Then the new tenant is deleted

    @accessibility @regression
    Scenario: As a tenant management user, I can see the welcome page without any critical and serious accessibility issues
        When the user goes to the tenant management welcome page
        Then no critical or serious accessibility issues on "tenant management welcome page"

    # TEST DATA: a user without beta-tester role
    @TEST_CS-733 @REQ_CS-640 @regression
    Scenario: As a non-beta-tester user, I cannot create a new tenant in ADSP
        Given the user is on the tenant management welcome page
        When the user selects get started button
        And the user clicks Sign in button
        And the user enters "env{email3}" and "env{password3}", and clicks login button
        Then the user views a message of cannot create a tenant without beta-tester role
        When the user clicks back to sign in page button
        Then the user views the tenant management welcome page title

    # TEST DATA: autotest tenant exists
    @TEST_CS-332 @REQ_CS-791 @regression
    Scenario: As a tenant management user, I cannot create a tenant having a name with special chars or the same as an existing name
        Given the user is on the tenant management welcome page
        When the user selects get started button
        And the user clicks Sign in button
        And the user enters "env{email2}" and "env{password2}", and clicks login button
        Then the user views create tenant page
        When the user enters "autotest!&%" as tenant name, clicks create tenant button and waits "2" seconds
        Then the user views the error message of "Value not valid for Tenant name: Names cannot contain special characters (e.g. ! & %)." for tenant creation
        When the user enters "autoTest" as tenant name, clicks create tenant button and waits "2" seconds
        Then the user views the error message of "This tenant name has already been used" for tenant creation

    @TEST_CS-1435 @REQ_CS-1384 @regression
    Scenario: As an interested service owner, I can see examples on the tenant admin landing page, so I can find and go to examples
        When the user goes to the tenant management welcome page
        Then the user views Chat app card under Example apps section
        And the Learn More button for Chat app redirects users to ADSP Chat Example