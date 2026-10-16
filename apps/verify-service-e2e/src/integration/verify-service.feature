@verify-service
Feature: Verify service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can generate a verification code for a key
    When a developer sends a generate code request for key "autotest-reg-key"
    Then a 200 response is returned with a generated verification code

  @regression @api
  Scenario: As a developer, I can verify a correct verification code
    When a developer generates and verifies a code for key "autotest-verify-key"
    Then the verification response returns verified as "true"

  @regression @api
  Scenario: As a developer, verifying an incorrect code returns false
    When a developer generates a code for key "autotest-wrong-key"
    And a developer verifies key "autotest-wrong-key" with code "000000"
    Then the verification response returns verified as "false"
