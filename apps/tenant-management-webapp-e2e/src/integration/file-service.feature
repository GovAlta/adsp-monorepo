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
      | Request URL       | Request URL With Urn                      | Name   | Service | Service URL     |
      | /api/discovery/v1 | /api/discovery/v1?urn=urn:ads:arcgis:maps | arcgis | maps    | maps.alberta.ca |

  @TEST_CS-317 @REQ_CS-233 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can reference files using an urn
    Given a testing mapping of "<Name>", "<Service>" and "<Service URL>" is inserted with "<Request URL>"
    When the user sends a discovery request with "<Request URL With Urn And File Resource Path>"
    Then the user can get the URL with "<File Resource URL>"
    When the user sends a delete request of "<Name>" with "<Request URL>"
    Then the testing mapping is removed
    Examples:
      | Request URL       | Request URL With Urn And File Resource Path                      | Name   | Service | Service URL     | File Resource URL                     |
      | /api/discovery/v1 | /api/discovery/v1?urn=urn:ads:arcgis:maps:/files/v1/files/123456 | arcgis | maps    | maps.alberta.ca | maps.alberta.ca/files/v1/files/123456 |

  # Data required before running the file types and files api tests
  # TODO: file-service-admin now has read/write permissions across all types; this is a simplification so that the tenant admin can try test files without permission restrictiono.
  # Tenant: autotest
  # File type #1: autotest-type3; auto-test-role1 (read roles and update roles); Anonymous read - false
  # (no longer needed) File type #2: autotest-type4; auto-test-role2 (read roles and update roles); Anonymous read - false
  # File type #3: autotest-type5; file-service-admin (update roles); Anonymous read - true
  # File type #4: autotest-type6 (roles can be any)
  # File #1: filename - autotest-file3.pdf; file type - autotest-type3; record id - autotest-recordid-3
  # (no longer needed) File #2: filename - autotest-file4.pdf; file type - autotest-type4; record id - autotest-recordid-4
  # File #3: filename - autotest-file5.pdf; file type - autotest-type5; record id - autotest-recordid-5

  @TEST_CS-438 @REQ_CS-227 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can consume the file service API to upload files from my service
    When a developer of a GoA digital service sends a file upload request with "<Request Endpoint>", "<Type Name>", "<File Name>" and "<Record Id>"
    Then "<Status Code>" is returned for the file upload request as well as a file urn with a successful upload

    Examples:
      | Request Endpoint | Type Name      | File Name        | Record Id             | Status Code |
      | /file/v1/files/  | autotest-type3 | autotest-new.txt | autotest-recordid-new | 200         |
  #     | /file/v1/files/  | autotest-type4 | autotest-new2.txt | autotest-recordid-new2 | 200         |

  @TEST_CS-439 @REQ_CS-227 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can consume the file service API to download files from my service
    When a developer of a GoA digital service sends a file download request with "<Request endpoint>", "<Request Type>", "<Type>", "<File Name>", "<Record Id>" and "<Anonymous>"
    Then "<Status Code>" is returned for the file upload request

    Examples:
      | Request endpoint                             | Request Type | Type           | File Name          | Record Id           | Status Code | Anonymous      |
      | /file/v1/files/<fileid>/download?unsafe=true | GET          | autotest-type3 | autotest-file3.pdf | autotest-recordid-3 | 200         | AnonymousFalse |
  # | /file/v1/files/<fileid>/download?unsafe=true | GET          | autotest-type4 | autotest-file4.pdf | autotest-recordid-4 | 200         | AnonymousFalse |
  # CS-888 needs to be fixed for the following test to pass
  # | /file/v1/files/<fileid>/download?unsafe=true | GET          | autotest-type5 | autotest-file5.pdf | autotest-recordid-5 | 200         | AnonymousTrue  |

  @TEST_CS-440 @REQ_CS-227 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can consume the file service API to get file metadata from my service
    When a developer of a GoA digital service sends a file metadata request with "<Request endpoint>", "<Request Type>", "<Type>", "<File Name>" and "<Record Id>"
    Then "<Status Code>" is returned for the file upload request as well as "<File Name>", file size and created time with a succesful request

    Examples:
      | Request endpoint        | Request Type | Type           | File Name          | Record Id           | Status Code |
      | /file/v1/files/<fileid> | GET          | autotest-type3 | autotest-file3.pdf | autotest-recordid-3 | 200         |
  #     | /file/v1/files/<fileid> | GET          | autotest-type4 | autotest-file4.pdf | autotest-recordid-4 | 200         |

  # TODO: Test is no longer relevant with removal of file service enable/disable
  @TEST_CS-305 @REQ_CS-195 @regression @ignore
  Scenario: As a GoA service owner, I can enable and disable the file service to my tenant
    Given a service owner user is on file services overview page
    When the user "disables" file service
    Then file service status is "Inactive"
    And "Overview, Documentation" file service tabs are "visible"
    And "Test Files, File types" file service tabs are "invisible"
    When the user "enables" file service
    Then file service status is "Active"
    And "Overview , Test Files, File types, Documentation" file service tabs are "visible"

  @TEST_CS-495 @REQ_CS-408 @regression
  Scenario: Test As a service owner, I can see the API documentation for file service in the tenant admin, so I can understand how to use the API
    Given a service owner user is on file services overview page
    Then the user views the link for "File service" API docs
    When the user goes to the web link of the API docs
    Then the user views "File service" API documentation

  @accessibility @regression
  Scenario: As a service owner, I can manage file services without any critical or serious accessibility issues
    Given a service owner user is on file services overview page
    Then no critical or serious accessibility issues on "file service overview page"

  @TEST_CS-315 @REQ_CS-196 @FileTypes @regression
  Scenario: As a GoA service admin, I can add, update and remove file types
    Given a service owner user is on file services overview page
    When the user selects "File types" tab for "File services"
    Then the user views file types page
    When the user adds a file type of "autotest-add", "Anyone (Anonymous)", "auto-test-role1, file-service-admin"
    Then the user "views" the file type of "autotest-add", "Anyone (Anonymous)", "auto-test-role1, file-service-admin"
    When the user updates the file type of "autotest-add", "Anyone (Anonymous)", "auto-test-role1, file-service-admin" to be of "autotest-modify", "auto-test-role1", "auto-test-role2"
    Then the user "views" the file type of "autotest-modify", "auto-test-role1", "auto-test-role2"
    When the user removes the file type of "autotest-modify", "auto-test-role1", "auto-test-role2"
    Then the user "should not view" the file type of "autotest-modify", "auto-test-role1", "auto-test-role2"

  # TODO: This is broken after removal of the file service specific 'feedback zone'; re-enable after feedback zone implementation.
  @FileTypes @regression @ignore
  Scenario: As a GoA service admin, I cannot add a file type with the same name as names of the existing file types
    Given a service owner user is on file services overview page
    When the user selects "File types" tab for "File services"
    Then the user views file types page
    When the user adds a file type of "autotest-type6", "auto-test-role1", "auto-test-role2"
    Then the user views an error message for duplicated file name

  @FileTypes @accessibility @regression
  Scenario: As a service owner, I can manage file types without any critical or serious accessibility issues
    Given a service owner user is on file services overview page
    When the user selects "File types" tab for "File services"
    Then no critical or serious accessibility issues on "file types page"

  @TEST_CS-316 @REQ_CS-196 @FileTypes @regression
  Scenario: As a GoA service owner, I cannot remove an in-use file type
    Given a service owner user is on file services overview page
    When the user selects "File types" tab for "File services"
    Then the user views file types page
    When the user clicks Delete button for file type "autotest-type5", "Anonymous", "file-service-admin"
    Then the user views file type current in user modal for "autotest-type5"
    When the user clicks Okay button
    Then the user views the file type "autotest-type5"