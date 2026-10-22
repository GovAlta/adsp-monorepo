@pii-service
Feature: PII service

  Background:
    Given a user has obtained an authentication token

  @regression @api
  Scenario: As a developer, I can list available PII entity recognizers
    When a developer sends a request to list PII entities
    Then a 200 response is returned with entity types including "EMAIL_ADDRESS"

  @regression @api
  Scenario: As a developer, I can analyze text for PII entities
    When a developer sends a PII analyze request with text "Contact us at test@example.com for help"
    Then a 200 response is returned with recognized PII entities

  @regression @api
  Scenario: As a developer, I can anonymize text containing PII
    When a developer sends a PII anonymize request with text "Contact us at test@example.com for help"
    Then a 200 response is returned with anonymized text
