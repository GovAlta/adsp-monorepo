@REQ_CS-224 @file-service
Feature: File service

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
    Then "<Status Code>" is returned for the file metadata request as well as "<File Name>", file size and created time with a successful request

    Examples:
      | Request endpoint        | Request Type | Type           | File Name          | Record Id           | Status Code |
      | /file/v1/files/<fileid> | GET          | autotest-type3 | autotest-file3.pdf | autotest-recordid-3 | 200         |
  #     | /file/v1/files/<fileid> | GET          | autotest-type4 | autotest-file4.pdf | autotest-recordid-4 | 200         |

  @TEST_CS-2110 @REQ_CS-2069 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can consume the file type API to set and disable file retention
    When a developer of a GoA digital service set autotype7 request with "<Request Endpoint>" retention
    Then "<Status Code>" is returned after file retention be set.
    When a developer of a GoA digital service set disable autotype7 request with "<Request Endpoint>" retention
    Then "<Status Code>" is returned after file retention be set.

    Examples:
      | Request Endpoint                                      | Status Code |
      | /configuration/v2/configuration/platform/file-service | 200         |

  @TEST_CS-2075 @REQ_CS-2069 @regression @api
  Scenario Outline: As a developer of a GoA digital service, I can test the default PDF file type configuration through API
    When a developer of a GoA digital service get default PDF file type configuration request with "<Request Endpoint>"
    Then "<Status Code>" is returned after file retention be set.
    Then check Generated PDF file type retention days is 30

    Examples:
      | Request Endpoint                                           | Status Code |
      | /configuration/v2/configuration/platform/file-service?core | 200         |

  @TEST_CS-2305 @REQ_CS-2037 @regression @api
  Scenario Outline: As a developer, I can query files by last accessed time criteria, so I can file stale files
    Given a service owner user is on Files overview page
    When the user selects "Uploaded files" tab for "File"
    Then the user views uploaded files page
    When the user searches file types with "autotest-file3.pdf" as file name and "N/A" as file type on Uploaded files page
    And the user clicks download button for "autotest-file3.pdf"
    And the user waits "5" seconds
    And a developer user sends a file last access request with "<Request Endpoint>", "<Last Accessed After>", "<Last Accessed Before>"
    Then "<Status Code>" is returned for the file last access request as well as "lastAccessed" property for "autotest-file3.pdf"

    Examples:
      | Request Endpoint | Last Accessed After | Last Accessed Before | Status Code |
      | /file/v1/files   | Now-2mins           | Now+2mins            | 200         |

  # TODO: Test is no longer relevant with removal of file service enable/disable
  @TEST_CS-305 @REQ_CS-195 @regression @ignore
  Scenario: As a tenant admin, I can enable and disable the file service to my tenant
    Given a service owner user is on Files overview page
    When the user "disables" file service
    Then file service status is "Inactive"
    And "Overview, Documentation" file service tabs are "visible"
    And "Test Files, File types" file service tabs are "invisible"
    When the user "enables" file service
    Then file service status is "Active"
    And "Overview , Test Files, File types, Documentation" file service tabs are "visible"

  @TEST_CS-495 @REQ_CS-408 @regression
  Scenario: As a tenant admin, I can see the API documentation for file service in the tenant admin, so I can understand how to use the API
    Given a service owner user is on Files overview page
    Then the user views the link of API docs for "File service"
    When the user goes to the web link of the API docs
    Then the user views "File service" API documentation

  @TEST_CS-315 @TEST_CS-2526 @REQ_CS-2410 @REQ_CS-196 @FileTypes @regression @prod
  Scenario: As a tenant admin, I can add, update and remove file types
    Given a service owner user is on Files overview page
    When the user selects "File types" tab for "File"
    Then the user views file types page
    When the user clicks Add file type button on file types page
    Then the user views Add file type modal
    When the user enters "autotest-addEditDelete" on Add file type modal
    And the user clicks Save button on Add file type modal
    Then the user views file type page of "autotest-addEditDelete"
    And the user views "Protected A" selected as default security classification
    And the user views "Public, Protected A, Protected B, Protected C" in security classification dropdown in file type editor
    When the user enters "Protected B", "public", "auto-test-role1", "30" on file type page
    And the user clicks Save button on file type page
    And the user clicks Back button on file type page
    Then the user "views" the file type of "autotest-addEditDelete", "Protected B", "30"
    When the user clicks "Edit" button for the file type of "autotest-addEditDelete", "Protected B", "30"
    Then the user views file type page of "autotest-addEditDelete"
    When the user enters "Protected C", "auto-test-role1", "auto-test-role2", "10" on file type page
    And the user clicks Save button on file type page
    And the user clicks Back button on file type page
    Then the user "views" the file type of "autotest-addEditDelete", "Protected C", "10"
    When the user clicks "Delete" button for the file type of "autotest-addEditDelete", "Protected C", "10"
    Then the user views Delete file type modal for "autotest-addEditDelete"
    When the user clicks Delete button on file type modal
    Then the user "should not view" the file type of "autotest-addEditDelete", "Protected C", "10"

  @FileTypes @regression
  Scenario: As a tenant admin, I cannot add a file type with the same name as names of the existing file types
    Given a service owner user is on Files overview page
    When the user selects "File types" tab for "File"
    Then the user views file types page
    When the user clicks Add file type button on file types page
    When the user enters "autotest-type6" on Add file type modal
    Then the user views an error message for duplicated file name for "autotest-type6" in Add file modal

  @accessibility @regression
  Scenario: As a tenant admin, I can use file pages without any critical or serious accessibility issues
    Given a service owner user is on Files overview page
    Then no critical or serious accessibility issues on "file service overview page"
    When the user selects "File types" tab for "File"
    # Adding classification column pushed the action buttons outside the screen in low resolution, which causes a serious accessibility issue
    # There is a pending task to remove roles columns, which would solve this issue
    # Then no critical or serious accessibility issues on "file types page"
    When the user clicks Add file type button on file types page
    Then no critical or serious accessibility issues for "file type modal" on "file types page"
    When the user clicks Cancel button on file type modal
    When the user selects "Uploaded files" tab for "File"
    Then no critical or serious accessibility issues on "file uploaded files page"

  @TEST_CS-316 @REQ_CS-196 @FileTypes @regression
  Scenario: As a tenant admin, I cannot remove an in-use file type
    Given a service owner user is on Files overview page
    When the user selects "File types" tab for "File"
    Then the user views file types page
    When the user clicks "Delete" button for the file type of "autotest-type5", "empty", "N/A"
    Then the user views file type current in use modal for "autotest-type5"
    When the user clicks Okay button on file type current in use modal
    Then the user "views" the file type of "autotest-type5", "empty", "N/A"

  @TEST_CS-1411 @REQ_CS-1358 @FileTypes @regression @prod
  Scenario: As a tenant admin, can see core file types
    Given a service owner user is on Files overview page
    When the user selects "File types" tab for "File"
    Then the user views file types page
    And the user views the core file types with no actions

  @TEST_CS-2235 @REQ_CS-2061 @FileTypes @regression
  Scenario: As tenant admin, I can filter test files by file type
    Given a service owner user is on Files overview page
    When the user selects "Uploaded files" tab for "File"
    When the user searches file types with "N/A" as file name and "autotest-type3" as file type on Uploaded files page
    Then the user views files with "autotest-type3" type on uploaded files page
    When the user clicks Reset button on uploaded files page
    Then the user views files for other types than "autotest-type3" on uploaded files page