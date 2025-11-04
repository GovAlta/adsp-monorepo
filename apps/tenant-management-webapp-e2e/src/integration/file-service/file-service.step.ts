import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import fd = require('form-data');
// NOTE: import from dist since browserify/tsify preprocessors don't seem to handle resolving axios module properly.
import axios from 'axios/dist/browser/axios.cjs';
import type { AxiosResponse } from 'axios';
import commonlib from '../common/common-library';
import fileServicePage from './file-service.page';

const fileServiceObj = new fileServicePage();
let responseObj: Cypress.Response<any>;
let axiosResponse: AxiosResponse;
let axiosError;
let fileId;

Given(
  'a testing mapping of {string}, {string} and {string} is inserted with {string}',
  function (urnname, urnservice, serviceurl, request) {
    const requestURL = Cypress.env('tenantManagementApi') + request;
    const name = urnname;
    const service = urnservice;
    const host = serviceurl;

    cy.request({
      method: 'POST',
      url: requestURL,
      auth: {
        bearer: Cypress.env('core-api-token'),
      },
      body: {
        name,
        services: [{ service, host }],
      },
      timeout: 1200000,
    }).then(function (response) {
      expect(response.status).equals(201);
    });
  }
);

When('the user sends a discovery request with {string}', function (request) {
  const requestURL = Cypress.env('tenantManagementApi') + request;
  cy.request({
    method: 'GET',
    url: requestURL,
    auth: {
      bearer: Cypress.env('core-api-token'),
    },
  }).then(function (response) {
    responseObj = response;
  });
});

Then('the user should get a map of logical names to urls for all services', function () {
  // Verify the response has 200 status and an array of mappings
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body.length).is.least(1);
  responseObj.status = 0; // Set status code to be ZERO after validation to avoid the same response status to be used later
});

Then('the user should get {string} with a mapped URL for the individual service', function (fileServiceURL) {
  // Verify that response has 200 status and url of file service
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('url').to.contain(fileServiceURL);
  responseObj.status = 0;
});

When('the user sends a delete request of {string} with {string}', function (urnname, request) {
  const requestURL = Cypress.env('tenantManagementApi') + request + '/' + urnname;
  cy.request({
    method: 'DELETE',
    url: requestURL,
    auth: {
      bearer: Cypress.env('core-api-token'),
    },
  }).then(function (response) {
    responseObj = response;
  });
});

Then('the testing mapping is removed', function () {
  expect(responseObj.status).equals(200);
  responseObj.status = 0; // Set status code to be ZERO after validation to avoid the same response status to be used later
});

Then('the user can get the URL with {string}', function (fileResourceURL) {
  // Verify that response has 200 status and url of file resource
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('url').to.contain(fileResourceURL);
  responseObj.status = 0; // Set status code to be ZERO after validation to avoid the same response status to be used later
});

When(
  'a developer of a GoA digital service sends a file upload request with {string}, {string}, {string} and {string}',
  function (reqEndPoint, fileTypeName, fileName: string, recordId) {
    // Get type id
    let typeId;
    const allTypesRequestURL = Cypress.env('fileApi') + '/file/v1/types';
    const fileUploadRequestURL = Cypress.env('fileApi') + reqEndPoint;
    cy.request({
      method: 'GET',
      url: allTypesRequestURL,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
    }).then(async function (response) {
      responseObj = response;
      // TODO: Type id is just the name now, so this is no longer necessary but perhaps more robust?
      // Get type id from the array of all types for the current user
      for (let arrayIndex = 0; arrayIndex < response.body.length; arrayIndex++) {
        if (response.body[arrayIndex].name == fileTypeName) {
          typeId = response.body[arrayIndex].id;
        }
      }
      // Output to cypress console for information only
      Cypress.log({
        name: 'File Type Id for "' + fileTypeName + '" : ',
        message: typeId,
      });

      // File upload with the space id and type id
      const formData = new fd();
      formData.append('type', typeId);
      formData.append('filename', fileName);
      formData.append('recordId', recordId);

      const fileSample = new File(['Test file upload'], fileName, {
        type: 'text/plain',
      });
      formData.append('file', fileSample);

      // Perform the request and store response
      try {
        axiosResponse = await axios.post(fileUploadRequestURL, formData, {
          headers: { Authorization: `Bearer ${Cypress.env('autotest-admin-token')}` },
        });
        cy.log(JSON.stringify(axiosResponse.data));
        // Store file id
        fileId = axiosResponse.data.id;
      } catch (err) {
        axiosError = err;
        cy.log(String(err));
      }
    });
  }
);

Then(
  '{string} is returned for the file upload request as well as a file urn with a successful upload',
  function (statusCode) {
    if (axiosError == undefined) {
      expect(axiosResponse.status).to.equal(Number(statusCode));
      if (statusCode == '200') {
        // Delete the uploaded file
        const deleteFileRequestURL = Cypress.env('fileApi') + '/file/v1/files/' + fileId;
        cy.request({
          method: 'DELETE',
          url: deleteFileRequestURL,
          auth: {
            bearer: Cypress.env('autotest-admin-token'),
          },
        }).then(async function (response) {
          expect(response.status).to.equal(200);
        });
      }
    } else {
      expect(JSON.stringify(axiosError)).to.include('status code ' + statusCode);
    }
  }
);

// Get file id with file name, file type name and record id for the space the user token has
function getFileId(fileName, fileTypeName, recordId, token) {
  let fileId: string;
  return new Cypress.Promise((resolve, reject) => {
    try {
      const filesRequestURL = Cypress.env('fileApi') + '/file/v1/files?criteria={"typeEquals":"' + fileTypeName + '"}';
      cy.request({
        method: 'GET',
        url: filesRequestURL,
        auth: {
          bearer: token,
        },
      }).then(function (response) {
        // Get file id from the array of all files for the current user's space
        for (let arrayIndex = 0; arrayIndex < response.body.results.length; arrayIndex++) {
          if (
            response.body.results[arrayIndex].filename == fileName &&
            response.body.results[arrayIndex].typeName == fileTypeName &&
            response.body.results[arrayIndex].recordId == recordId
          ) {
            fileId = response.body.results[arrayIndex].id;
          }
        }
        expect(fileId).not.to.be.undefined; // Fail the test if no file id was found
        // Output to cypress console for information only
        Cypress.log({
          name: 'File Id : ',
          message: fileId,
        });
        resolve(fileId);
      });
    } catch (error) {
      reject(error);
    }
  });
}

When(
  'a developer of a GoA digital service sends a file download request with {string}, {string}, {string}, {string}, {string} and {string}',
  function (reqEndPoint: string, reqType: string, fileTypeName, fileName, recordId, anonymous) {
    // Get file Id and use the file id to download the file
    getFileId(fileName, fileTypeName, recordId, Cypress.env('autotest-admin-token')).then(function (fileId) {
      const downloadEndPoint = reqEndPoint.replace('<fileid>', fileId as string);
      const fileDownloadRequestURL = Cypress.env('fileApi') + downloadEndPoint;
      // Download the file using file id with or without user token
      if (anonymous == 'AnonymousFalse') {
        cy.request({
          method: reqType,
          url: fileDownloadRequestURL,
          failOnStatusCode: false,
          auth: {
            bearer: Cypress.env('autotest-admin-token'),
          },
        }).then(function (response) {
          cy.log('Got response for' + fileName);
          responseObj = response;
        });
      } else if (anonymous == 'AnonymousTrue') {
        cy.request({
          method: reqType,
          url: fileDownloadRequestURL,
          failOnStatusCode: false,
        }).then(function (response) {
          responseObj = response;
        });
      } else {
        expect(anonymous).to.be.oneOf(['AnonymousFalse', 'AnonymousTrue']);
      }
    });
  }
);

Then('{string} is returned for the file upload request', function (statusCode) {
  expect(responseObj.status).to.equal(Number(statusCode));
  responseObj.status = 0; // Set status code to be ZERO after validation to avoid the same response status to be used later
});

When(
  'a developer of a GoA digital service sends a file metadata request with {string}, {string}, {string}, {string} and {string}',
  function (reqEndPoint: string, reqType: string, fileTypeName, fileName, recordId) {
    getFileId(fileName, fileTypeName, recordId, Cypress.env('autotest-admin-token')).then(function (fileId) {
      const fileMetadataEndPoint = reqEndPoint.replace('<fileid>', fileId as string);
      const fileDownloadRequestURL = Cypress.env('fileApi') + fileMetadataEndPoint;
      // Get file metadata using file id
      cy.request({
        method: reqType,
        url: fileDownloadRequestURL,
        failOnStatusCode: false,
        auth: {
          bearer: Cypress.env('autotest-admin-token'),
        },
      }).then(function (response) {
        responseObj = response;
      });
    });
  }
);

Then(
  '{string} is returned for the file metadata request as well as {string}, file size and created time with a successful request',
  function (statusCode, fileName) {
    expect(responseObj.status).to.equal(Number(statusCode));
    if (responseObj.status == 200) {
      expect(responseObj.body.filename).to.equal(fileName);
      expect(responseObj.body.size).to.be.greaterThan(1);
      expect(responseObj.body.created).not.to.be.undefined;
    }
    responseObj.status = 0; // Set status code to be ZERO after validation to avoid the same response status to be used later
  }
);

Given('a service owner user is on Files overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('File', 4000);
});

When('the user {string} file service', function (action) {
  // Verify action
  expect(action).to.be.oneOf(['enables', 'disables']);
  // Check file service status
  fileServiceObj
    .fileHeaderTag()
    .invoke('text')
    .then((text) => {
      // Check if it's already in the desired status
      switch (text) {
        case 'Inactive':
          if (action == 'enables') {
            fileServiceObj.enableServiceButton().click();
            cy.wait(1000);
          } else if (action == 'disables') {
            cy.log('The status is already Inactive');
          }
          break;
        case 'Active':
          if (action == 'disables') {
            fileServiceObj.disableServiceButton().click();
            cy.wait(1000);
          } else if (action == 'enables') {
            cy.log('The status is already Active');
          }
          break;
        default:
          expect(text).to.be.oneOf(['Inactive', 'Active']);
      }
    });
});

Then('file service status is {string}', function (expectedStatus) {
  fileServiceObj.fileHeaderTag().invoke('text').should('eq', expectedStatus);
});

When('the user disables file service', function () {
  fileServiceObj.disableServiceButton().click();
  cy.wait(1000);
});

Then('{string} file service tabs are {string}', function (tabStrings: string, visibility) {
  const tabArray = tabStrings.split(',');
  cy.log(tabStrings);
  switch (visibility) {
    case 'visible':
      fileServiceObj.fileServiceTabs().each((element, index) => {
        cy.wrap(element).invoke('text').should('eq', tabArray[index].trim());
      });
      break;
    case 'invisible':
      fileServiceObj.fileServiceTabs().each((element) => {
        for (let i = 0; i < tabArray.length; i++) {
          cy.wrap(element).invoke('text').should('not.equal', tabArray[i].trim());
        }
      });
      break;
    default:
      expect(visibility).to.be.oneOf(['visiable', 'invisible']);
  }
});

When('user goes to {string} tab', function (tabText: string) {
  fileServiceObj.fileServiceTab(tabText).click();
  cy.wait(2000);
});

Then('the user views file types page', function () {
  // Check if the new file type button presents
  fileServiceObj.addFileTypeButton().should('exist');
});

When('the user clicks Add file type button on file types page', function () {
  fileServiceObj.addFileTypeButton().shadow().find('button').click({ force: true });
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Add file type modal', function () {
  fileServiceObj.addFileTypeModalTitle().invoke('text').should('contains', 'Add file type');
});

When('the user enters {string} on Add file type modal', function (name: string) {
  fileServiceObj
    .addFileTypeModalNameField()
    .shadow()
    .find('input')
    .clear({ force: true })
    .type(name, { delay: 200, force: true });
});

When(
  'the user enters {string}, {string}, {string}, {string} on file type page',
  function (classification: string, readRole: string, updateRole: string, retention: string) {
    cy.viewport(1920, 1080);
    cy.wait(4000); //Wait for the client roles in the modal to show up

    //Enter security classification
    if (classification !== 'skip') {
      fileServiceObj
        .fileTypeClassificationDropdown()
        .invoke('attr', 'value')
        .then((classificationValue) => {
          if (classificationValue !== classification.toLowerCase()) {
            fileServiceObj.fileTypeClassificationDropdown().shadow().find('input').click({ force: true });
            fileServiceObj
              .fileTypeClassificationDropdown()
              .shadow()
              .find('li')
              .contains(classification)
              .click({ force: true });
            cy.wait(1000);
          }
        });
    }

    //Select roles
    if (readRole == 'public') {
      fileServiceObj
        .fileTypePagePublicCheckbox()
        .shadow()
        .find('[class^="container"]')
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (classAttr?.includes('selected')) {
            cy.log('Make public checkbox is already checked off. ');
          } else {
            fileServiceObj.fileTypePagePublicCheckbox().shadow().find('[class^="container"]').click({ force: true });
            cy.wait(1000);
          }
        });

      //Unselect all checkboxes
      fileServiceObj
        .fileTypePageCheckboxesTables()
        .find('goa-checkbox')
        .shadow()
        .find('[class^="container"]')
        .then((elements) => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute('class')?.includes('selected')) {
              elements[i].click();
            }
          }
        });

      //Select modify roles
      if (updateRole.toLowerCase() != 'empty') {
        const updateRoles = updateRole.split(',');
        for (let i = 0; i < updateRoles.length; i++) {
          if (updateRoles[i].includes(':')) {
            const clientRoleStringArray = updateRoles[i].split(':');
            let clientName = '';
            for (let j = 0; j < clientRoleStringArray.length - 1; j++) {
              if (j !== clientRoleStringArray.length - 2) {
                clientName = clientName + clientRoleStringArray[j].trim() + ':';
              } else {
                clientName = clientName + clientRoleStringArray[j];
              }
            }
            const roleName = clientRoleStringArray[clientRoleStringArray.length - 1];
            fileServiceObj
              .fileTypePageClientRolesTable(clientName)
              .find('.role-name')
              .contains(roleName)
              .next()
              .next()
              .find('goa-checkbox')
              .shadow()
              .find('[class^="container"]')
              .scrollIntoView()
              .click({ force: true });
          } else {
            fileServiceObj
              .fileTypePageRolesTable()
              .find('.role-name')
              .contains(updateRoles[i].trim())
              .next()
              .next()
              .find('goa-checkbox')
              .shadow()
              .find('[class^="container"]')
              .scrollIntoView()
              .click({ force: true }); // The checkbox clicking doesn't work properly (selects and unselects the checkbox).Need further investigation
          }
        }
      }
    } else {
      //Unselect Make public checkbox if not already unchecked
      fileServiceObj
        .fileTypePagePublicCheckbox()
        .shadow()
        .find('[class^="container"]')
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (classAttr?.includes('selected')) {
            fileServiceObj
              .fileTypePagePublicCheckbox()
              .shadow()
              .find('[class^="container"]')
              .click({ force: true, multiple: true });
            cy.wait(1000);
            cy.log('Make public checkbox has been unchecked. ');
            cy.wait(1000); // Wait for read roles to be enabled
          } else {
            cy.log('Make public checkbox is already unchecked. ');
          }
        });

      //Unselect all checkboxes
      fileServiceObj
        .fileTypePageCheckboxesTables()
        .find('goa-checkbox')
        .shadow()
        .find('[class^="container"]')
        .then((elements) => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute('class')?.includes('selected')) {
              elements[i].click();
              cy.wait(1000);
            }
          }
        });

      //Select read roles
      if (readRole.toLowerCase() != 'empty') {
        const readRoles = readRole.split(',');
        for (let i = 0; i < readRoles.length; i++) {
          fileServiceObj
            .fileTypePageCheckboxesTables()
            .find('goa-checkbox[testid="FileType-read-role-checkbox-' + readRoles[i].trim() + '"]')
            .shadow()
            .find('[class^="container"]')
            .click({ force: true, multiple: true });
        }
      }

      //Select modify roles
      if (updateRole.toLowerCase() != 'empty') {
        const updateRoles = updateRole.split(',');
        for (let i = 0; i < updateRoles.length; i++) {
          if (updateRoles[i].includes(':')) {
            const clientRoleStringArray = updateRoles[i].split(':');
            let clientName = '';
            for (let j = 0; j < clientRoleStringArray.length - 1; j++) {
              if (j !== clientRoleStringArray.length - 2) {
                clientName = clientName + clientRoleStringArray[j].trim() + ':';
              } else {
                clientName = clientName + clientRoleStringArray[j];
              }
            }
            const roleName = clientRoleStringArray[clientRoleStringArray.length - 1];
            fileServiceObj
              .fileTypePageClientRolesTable(clientName)
              .find('.role-name')
              .contains(roleName)
              .next()
              .next()
              .find('goa-checkbox')
              .shadow()
              .find('[class^="container"]')
              .scrollIntoView()
              .click({ force: true });
          } else {
            fileServiceObj
              .fileTypePageRolesTable()
              .find('.role-name')
              .contains(updateRoles[i].trim())
              .next()
              .next()
              .find('goa-checkbox')
              .shadow()
              .find('[class^="container"]')
              .scrollIntoView()
              .click({ force: true });
          }
        }
      }
    }
    cy.wait(2000); //Wait the checkbox to be selected before proceeding

    //Enter retention
    if (retention == 'N/A') {
      fileServiceObj
        .fileRetentionCheckBox()
        .invoke('prop', 'checked')
        .then((checkedAttr) => {
          if (checkedAttr == 'true') {
            fileServiceObj.fileRetentionCheckBox().shadow().find('[class^="container"]').clear().click({ force: true });
          } else {
            cy.log('Active retention policy checkbox is already unselected. ');
          }
        });
    } else {
      fileServiceObj
        .fileRetentionCheckBox()
        .invoke('prop', 'checked')
        .then((checkedAttr) => {
          cy.log(checkedAttr!);
          if (checkedAttr != 'true') {
            fileServiceObj.fileRetentionCheckBox().shadow().find('[class^="container"]').click({ force: true });
            cy.wait(1000);
          }
          fileServiceObj
            .fileRetentionPeriodInput()
            .shadow()
            .find('input')
            .clear({ force: true })
            .type(retention, { delay: 200, force: true });
        });
    }
  }
);

When('the user clicks Save button on file type page', function () {
  fileServiceObj.fileTypePageSaveButton().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

When('the user clicks Back button on file type page', function () {
  fileServiceObj.fileTypePageBackButton().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

When('the user clicks Save button on Add file type modal', function () {
  cy.wait(1000); // Wait for the button to be enabled
  fileServiceObj.addFileTypeModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(4000); // Wait the file type list to refresh
});

Then('the user views file type page of {string}', function (name) {
  fileServiceObj.fileTypePageNameField().should('contain.text', name);
});

When('the user clicks Cancel button on file type modal', function () {
  fileServiceObj.addFileTypeModalCancelButton().shadow().find('button').click({ force: true });
  cy.wait(1000); // Wait the file type list to refresh
});

Then(
  'the user {string} the file type of {string}, {string}, {string}',
  function (action, name, classification, retention) {
    findFileType(name, classification, retention).then((rowNumber) => {
      switch (action) {
        case 'views':
          expect(rowNumber).to.be.greaterThan(0, 'File type of ' + name + ' has row #' + rowNumber);
          break;
        case 'should not view':
          expect(rowNumber).to.equal(0, 'File type of ' + name + ' has row #' + rowNumber);
          break;
        default:
          expect(action).to.be.oneOf(['views', 'should not view']);
      }
    });
  }
);

When(
  'the user clicks {string} button for the file type of {string}, {string}, {string}',
  function (button, name, classification, retention) {
    findFileType(name, classification, retention).then((rowNumber) => {
      switch (button) {
        case 'Edit':
          fileServiceObj.fileTypeEditButton(rowNumber).shadow().find('button').click({ force: true });
          break;
        case 'Delete':
          cy.wait(1000); // Wait to avoid no modal showing up for delete button clicking
          fileServiceObj.fileTypeDeleteButton(rowNumber).shadow().find('button').click({ force: true });
          cy.wait(2000); // The delete modal showing takes time
          break;
        default:
          expect(button).to.be.oneOf(['Edit', 'Delete']);
      }
    });
  }
);

Then('the user views Delete file type modal for {string}', function (fileTypeName) {
  cy.wait(1000); // Wait for modal
  // fileServiceObj.fileTypeDeleteModal().should('be.visible');
  fileServiceObj.fileTypeDeleteModalTitle().invoke('text').should('contains', 'Delete file type');
  fileServiceObj.fileTypeDeleteModalContent().invoke('text').should('contains', fileTypeName);
});

When('the user clicks Delete button on file type modal', function () {
  // fileServiceObj.fileTypeDeleteModal().should('be.visible');
  fileServiceObj.fileTypeDeleteModalDeleteButton().shadow().find('button').scrollIntoView().click({ force: true });
  cy.wait(2000); //Wait the file type list to refresh
});

//Find file type with name and retention number
//Input: file name, file security classification and retention number
//Return: row number if the file type is found; zero if the file type isn't found
function findFileType(name, classification, retention) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      let targetedNumber = 2;
      if (classification != 'empty') {
        targetedNumber = targetedNumber + 1;
      }
      fileServiceObj
        .fileTypeTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the name cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(name)) {
              counter = counter + 1;
            }
            if (classification != 'empty') {
              if (rowElement.cells[1].innerHTML.includes(classification.toLowerCase())) {
                counter = counter + 1;
              }
            }
            if (rowElement.cells[2].innerHTML.includes(retention)) {
              counter = counter + 1;
            }
            Cypress.log({
              name: 'Number of matched items for row# ' + rowElement.rowIndex + ': ',
              message: String(String(counter)),
            });
            if (counter == targetedNumber) {
              rowNumber = rowElement.rowIndex;
            }
          });
          Cypress.log({
            name: 'Row number for the found file type: ',
            message: String(rowNumber),
          });
          resolve(rowNumber);
        });
    } catch (error) {
      reject(error);
    }
  });
}

Then('the user views an error message for duplicated file name for {string} in Add file modal', function (name) {
  fileServiceObj
    .addFileTypeModalNameFormItem()
    .invoke('attr', 'error')
    .should('eq', 'Duplicate File type name ' + name + '. Must be unique.');
});

Then('the user views file type current in use modal for {string}', function (fileTypeName) {
  fileServiceObj.fileTypeInUseModalTitle().invoke('text').should('eq', 'File type current in use');
  fileServiceObj
    .fileTypeInUseModalContent()
    .invoke('text')
    .should(
      'contain',
      'You are unable to delete the file type ' + fileTypeName + ' because there are files within the file type'
    );
});

When('the user clicks Okay button on file type current in use modal', function () {
  fileServiceObj.fileTypeInUseModalOkayButton().shadow().find('button').scrollIntoView().click({ force: true });
  cy.wait(2000); //Wait the file type list to refresh
});

Then('the user views the core file types with no actions', function () {
  // Verify the core file types title exists
  fileServiceObj.coreFileTypesTitle().should('exist');

  // Verify at least one core file type
  fileServiceObj.coreFileTypesTable().find('tr').its('length').should('be.gte', 1);
});
function setOrDisableFileRetention(reqEndPoint, setRetention) {
  const requestURL = Cypress.env('configurationServiceApiUrl') + reqEndPoint;

  cy.request({
    method: 'PATCH',
    url: requestURL,
    auth: {
      bearer: Cypress.env('autotest-admin-token'),
    },
    body: {
      operation: 'UPDATE',
      update: {
        autotype7: {
          name: 'autotype7',
          updateRoles: ['file-service-admin'],
          readRoles: [],
          anonymousRead: true,
          id: 'autotype7',
          rules: {
            retention: {
              active: Boolean(setRetention),
              deleteInDays: 1,
              createdAt: new Date(),
            },
          },
        },
      },
    },
    timeout: 1200000,
  }).then(function (response) {
    responseObj = response;
  });
}
When('a developer of a GoA digital service set autotype7 request with {string} retention', function (reqEndPoint) {
  setOrDisableFileRetention(reqEndPoint, true);
});
When(
  'a developer of a GoA digital service set disable autotype7 request with {string} retention',
  function (reqEndPoint) {
    setOrDisableFileRetention(reqEndPoint, false);
  }
);

Then('{string} is returned after file retention be set.', function (statusCode) {
  // Verify the response has 200 status and an array of mappings
  expect(responseObj.status).to.eq(Number(statusCode));
});

Then('check Generated PDF file type retention days is 30', function () {
  const days = responseObj.body.latest.configuration['generated-pdf'].rules.retention.deleteInDays;
  expect(Number(days)).to.eq(30);
});

When(
  'a developer of a GoA digital service get default PDF file type configuration request with {string}',
  function (reqEndPoint) {
    const requestURL = Cypress.env('configurationServiceApiUrl') + reqEndPoint;
    cy.request({
      method: 'GET',
      url: requestURL,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
      failOnStatusCode: false,
    }).then(function (response) {
      responseObj = response;
    });
  }
);

When(
  'a developer of a GoA digital service can query files by last accessed time criteria with {string} for before yesterday',
  function (reqEndPoint) {
    const date = new Date();

    date.setDate(date.getDate() - 1);
    const requestURL = Cypress.env('fileApi') + reqEndPoint;
    +'?criteria={"lastAccessedBefore":' + '"' + date.toISOString() + '"' + '}';
    cy.request({
      method: 'GET',
      url: requestURL,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
      failOnStatusCode: false,
    }).then(function (response) {
      responseObj = response;
    });
  }
);

Then('check the file data before yesterday.', function () {
  const checkedDate = new Date(responseObj.body.results[0].lastAccessed);
  const yesterday = new Date().setDate(new Date().getDate() - 1);
  cy.wrap(checkedDate).should('be.greaterThan', new Date(yesterday));
});

When(
  'a developer of a GoA digital service can query files by last accessed time criteria with {string} for after month ago',
  function (reqEndPoint) {
    const date = new Date();

    date.setDate(date.getDate() - 30);
    const requestURL = Cypress.env('fileApi') + reqEndPoint;
    +'?criteria={"lastAccessedAfter":' + '"' + date.toISOString() + '"' + '}';
    cy.request({
      method: 'GET',
      url: requestURL,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
      failOnStatusCode: false,
    }).then(function (response) {
      responseObj = response;
    });
  }
);

Then('check the file data with in recent 30 days.', function () {
  const checkedDate = new Date(responseObj.body.results[0].lastAccessed);
  const monthTime = new Date().setDate(new Date().getDate() - 30);
  cy.wrap(checkedDate).should('be.greaterThan', new Date(monthTime));
});

Then('the user clicks Active retention policy checkbox', function () {
  cy.wait(1000); // Wait for modal
  fileServiceObj.fileRetentionCheckBox().shadow().find('[class^="container"]').click({ force: true });
});

Then('the user view retention policy 1 days in file type modal', function () {
  cy.wait(1000);
  fileServiceObj.fileRetentionPeriodInput().invoke('val').should('equal', '1');
});

Then('the user uncheck Active retention policy checkbox', function () {
  cy.wait(1000); // Wait for modal
  fileServiceObj.fileRetentionCheckBox().shadow().find('[class^="container"]').click({ force: true });
});

Then('the user views uploaded files page', function () {
  fileServiceObj.uploadedFilesPageTitle().should('exist');
});

When('the user searches {string} on Uploaded files page', function (fileName: string) {
  fileServiceObj
    .uploadedFilesSearchFileName()
    .shadow()
    .find('input')
    .clear()
    .type(fileName, { delay: 200, force: true });
  fileServiceObj.uploadedFilesSearchButton().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

When('the user clicks download button for {string}', function (fileName) {
  fileServiceObj.uploadedFilesDownloadButton(fileName).shadow().find('button').click({ force: true });
});

When(
  'a developer user sends a file last access request with {string}, {string}, {string}',
  function (endPoint, lastAccessAfter: string, lastAccessBefore: string) {
    if (lastAccessAfter.match(/Now[+|-][0-9]+mins/g)) {
      lastAccessAfter = commonlib.nowPlusMinusMinutes(lastAccessAfter) as string;
    }
    if (lastAccessBefore.match(/Now[+|-][0-9]+mins/g)) {
      lastAccessBefore = commonlib.nowPlusMinusMinutes(lastAccessBefore) as string;
    }
    const requestURL =
      Cypress.env('fileApi') +
      endPoint +
      '?criteria={"lastAccessedAfter":"' +
      lastAccessAfter +
      '", "lastAccessedBefore":"' +
      lastAccessBefore +
      '"}';
    cy.request({
      method: 'GET',
      url: requestURL,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
      failOnStatusCode: false,
    }).then(function (response) {
      responseObj = response;
    });
  }
);

Then(
  '{string} is returned for the file last access request as well as {string} property for {string}',
  function (statusCode, property, fileName) {
    expect(responseObj.status).to.eq(Number(statusCode));
    expect(responseObj.body.results[0].filename).to.eq(fileName);
    expect(responseObj.body.results[0].lastAccessed).to.not.be.empty;
  }
);

Then('the user views {string} selected as default security classification', function (defaultClassification: string) {
  fileServiceObj
    .fileTypeClassificationDropdown()
    .invoke('attr', 'value')
    .should('eq', defaultClassification.toLowerCase());
});

Then(
  'the user views {string} in security classification dropdown in file type editor',
  function (dropdownOptions: string) {
    const options = dropdownOptions.split(',');
    fileServiceObj.fileTypeClassificationDropdownItems().then((elements) => {
      expect(elements.length).to.eq(options.length);
      for (let i = 0; i < options.length; i++) {
        expect(elements[i].getAttribute('value')).to.contain(options[i].trim().toLowerCase());
      }
    });
  }
);

When(
  'the user selects {string} in Filter file type dropdown on uploaded files page',
  function (dropdownItemName: string) {
    fileServiceObj
      .uploadedFilesFilterFileTypeDropdown()
      .shadow()
      .find('li')
      .contains(dropdownItemName)
      .click({ force: true });
    cy.wait(1000);
  }
);

When(
  'the user searches file types with {string} as file name and {string} as file type on Uploaded files page',
  function (fileName: string, fileType: string) {
    // Enter file name if it's not N/A
    if (fileName !== 'N/A') {
      fileServiceObj
        .uploadedFilesSearchFileName()
        .shadow()
        .find('input')
        .clear()
        .type(fileName, { delay: 200, force: true });
    }
    // Enter file type if it's not N/A
    if (fileType !== 'N/A') {
      fileServiceObj
        .uploadedFilesFilterFileTypeDropdown()
        .shadow()
        .find('li')
        .contains(fileType)
        .click({ force: true });
      cy.wait(1000);
    }
    // Click search button
    fileServiceObj.uploadedFilesSearchButton().shadow().find('button').click({ force: true });
    cy.wait(4000);
  }
);

Then('the user views files with {string} type on uploaded files page', function (fileType) {
  fileServiceObj.uploadFilesGridTypeCells().then((types) => {
    for (let i = 0; i < types.length; i++) {
      expect(types[i].outerText).to.eq(fileType);
    }
  });
});

When('the user clicks Reset button on uploaded files page', function () {
  fileServiceObj.uploadedFilesResetButton().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then('the user views files for other types than {string} on uploaded files page', function (fileType) {
  let counter = 0;
  fileServiceObj
    .uploadFilesGridTypeCells()
    .then((types) => {
      for (let i = 0; i < types.length; i++) {
        if (types[i].outerText !== fileType) {
          counter = counter + 1;
        }
      }
    })
    .then(() => {
      expect(counter).to.gt(0);
    });
});
