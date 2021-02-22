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
      | RequestURL        | Name   | Service | Service URL     |
      | /api/discovery/v1 | arcgis | maps    | maps.alberta.ca |

  @TEST_CS-344 @REQ_CS-232 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can discover individual service URL
    Given a testing mapping of "<Name>", "<Service>" and "<Service URL>" is inserted with "<Request URL>"
    When the user sends a discovery request with "<Request URL With Urn>"
    Then the user should get "<Service URL>" with a mapped URL for the individual service
    When the user sends a delete request of "<Name>" with "<Request URL>"
    Then the testing mapping is removed
    Examples:
      | Request URL       | Request URL With Urn                          | Name   | Service | Service URL     |
      | /api/discovery/v1 | /api/discovery/v1/urn?urn=urn:ads:arcgis:maps | arcgis | maps    | maps.alberta.ca |

  @TEST_CS-317 @REQ_CS-233 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can reference files using an urn
    Given a testing mapping of "<Name>", "<Service>" and "<Service URL>" is inserted with "<Request URL>"
    When the user sends a discovery request with "<Request URL With Urn And File Resource Path>"
    Then the user can get the URL with "<File Resource URL>"
    When the user sends a delete request of "<Name>" with "<Request URL>"
    Then the testing mapping is removed
    Examples:
      | Request URL       | Request URL With Urn And File Resource Path                          | Name   | Service | Service URL     | File Resource URL                     |
      | /api/discovery/v1 | /api/discovery/v1/urn?urn=urn:ads:arcgis:maps:/files/v1/files/123456 | arcgis | maps    | maps.alberta.ca | maps.alberta.ca/files/v1/files/123456 |