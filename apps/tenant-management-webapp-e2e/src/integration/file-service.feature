@REQ_CS-224 @file-service
Feature: File service

  @TEST_CS-311 @REQ_CS-232 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can get a map of urns to urls for all available services
    Given a testing mapping of "<Name>", "<Service>" and "<Service URL>" is inserted with "<RequestURL>"
    When the user sends a discovery request with "<RequestURL>"
    Then the user should get a map of logical names to urls for all services
    # Verify the URLs are from Dev or preprod or prod
    # And the user verifies that all urls are for the corrected deployed environment
    When the user sends a delete request of "<Name>" with "<RequestURL>"
    Then the testing mapping is removed
    Examples:
      | RequestURL     | Name   | Service | Service URL                        |
      | /api/discovery | ArcGIS | maps    | https://maps.alberta.ca/egn/change |

  @TEST_CS-344 @REQ_CS-232 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can discover individual service URL
    Given a testing mapping of "<Name>", "<Service>" and "<Service URL>" is inserted with "<RequestURL>"
    When the user sends a discovery request with "<RequestURLWithUrn>"
    Then the user should get "<Service URL>" with a mapped URL for the individual service
    When the user sends a delete request of "<Name>" with "<RequestURL>"
    Then the testing mapping is removed
    Examples:
      | RequestURL     | RequestURLWithUrn                          | Name   | Service | Service URL                        |
      | /api/discovery | /api/discovery/urn?urn=urn:ads:ArcGIS:maps | ArcGIS | maps    | https://maps.alberta.ca/egn/change |