import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import fd = require('form-data');
import axios, { AxiosResponse } from 'axios';
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
  function (reqEndPoint, fileTypeName, fileName, recordId) {
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
      const filesRequestURL = Cypress.env('fileApi') + '/file/v1/files';
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
  function (reqEndPoint, reqType, fileTypeName, fileName, recordId, anonymous) {
    // Get file Id and use the file id to download the file
    getFileId(fileName, fileTypeName, recordId, Cypress.env('autotest-admin-token')).then(function (fileId) {
      const downloadEndPoint = reqEndPoint.replace('<fileid>', fileId);
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
  function (reqEndPoint, reqType, fileTypeName, fileName, recordId) {
    getFileId(fileName, fileTypeName, recordId, Cypress.env('autotest-admin-token')).then(function (fileId) {
      const fileMetadataEndPoint = reqEndPoint.replace('<fileid>', fileId);
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
  '{string} is returned for the file upload request as well as {string}, file size and created time with a succesful request',
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

Then('{string} file service tabs are {string}', function (tabStrings, visibility) {
  const tabArray = tabStrings.split(',');
  cy.log(tabArray);
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

When('user goes to {string} tab', function (tabText) {
  fileServiceObj.fileServiceTab(tabText).click();
  cy.wait(2000);
});

Then('the user views file types page', function () {
  // Check if the new file type button presents
  fileServiceObj.addFileTypeButton().then((button) => {
    expect(button.length).to.be.gt(0); //element exists
  });
});

When('the user clicks Add file type button on file types page', function () {
  fileServiceObj.addFileTypeButton().click();
});

Then('the user views {string} file type modal', function (addOrEdit) {
  expect(addOrEdit).to.be.oneOf(['Add', 'Edit', 'Delete']);
  fileServiceObj
    .fileTypeModalTitle()
    .invoke('text')
    .should('contains', addOrEdit + ' file type');
});

When('the user enters {string}, {string}, {string} on file type modal', function (name, readRole, updateRole) {
  //Enter Name
  fileServiceObj.fileTypeModalNameField().clear().type(name);

  //Select Who can read
  if (readRole == 'public') {
    fileServiceObj
      .fileTypeModalPublicCheckbox()
      .invoke('attr', 'class')
      .then((classAttr) => {
        if (classAttr?.includes('-selected')) {
          cy.log('Make public checkbox is already checked off. ');
        } else {
          fileServiceObj.fileTypeModalPublicCheckbox().click();
        }
      });
  } else {
    //Unselect Make public checkbox if not already unchecked
    fileServiceObj
      .fileTypeModalPublicCheckbox()
      .invoke('attr', 'class')
      .then((classAttr) => {
        if (classAttr?.includes('-selected')) {
          fileServiceObj.fileTypeModalPublicCheckbox().click();
          cy.log('Make public checkbox is already checked off. ');
        } else {
          cy.log('Make public checkbox is already unchecked. ');
        }
      });
    //Unselect all read checkboxes
    fileServiceObj.fileTypeModalReadCheckboxes().then((elements) => {
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].className == 'goa-checkbox-container goa-checkbox--selected') {
          elements[i].click();
        }
      }
    });
    //Select read roles
    const readRoles = readRole.split(',');
    for (let i = 0; i < readRoles.length; i++) {
      fileServiceObj.fileTypeModalReadCheckbox(readRoles[i].trim()).click();
    }
  }

  //Unselect all modify checkboxes
  fileServiceObj.fileTypeModalModifyCheckboxes().then((elements) => {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].className == 'goa-checkbox-container goa-checkbox--selected') {
        elements[i].click();
      }
    }
  });

  //Select modify roles
  const updateRoles = updateRole.split(',');
  for (let i = 0; i < updateRoles.length; i++) {
    fileServiceObj.fileTypeModalModifyCheckbox(updateRoles[i].trim()).click();
  }
});

When('the user clicks Save button on file type modal', function () {
  fileServiceObj.fileTypeModalSaveButton().click();
  cy.wait(2000); // Wait the file type list to refresh
});

Then('the user {string} the file type of {string}, {string}, {string}', function (action, name, readRole, updateRole) {
  findFileType(name, readRole, updateRole).then((rowNumber) => {
    switch (action) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(
          0,
          'File type of ' + name + ', ' + readRole + ', ' + updateRole + ' has row #' + rowNumber
        );
        break;
      case 'should not view':
        expect(rowNumber).to.equal(
          0,
          'File type of ' + name + ', ' + readRole + ', ' + updateRole + ' has row #' + rowNumber
        );
        break;
      default:
        expect(action).to.be.oneOf(['views', 'should not view']);
    }
  });
});

When(
  'the user clicks {string} button for the file type of {string}, {string}, {string}',
  function (button, name, readRole, updateRole) {
    findFileType(name, readRole, updateRole).then((rowNumber) => {
      switch (button) {
        case 'Edit':
          fileServiceObj.fileTypeEditButton(rowNumber).click();
          break;
        case 'Delete':
          fileServiceObj.fileTypeDeleteButton(rowNumber).click();
          break;
        default:
          expect(button).to.be.oneOf(['Edit', 'Delete']);
      }
    });
  }
);

Then('the user views Delete file type modal for {string}', function (fileTypeName) {
  cy.wait(1000); // Wait for modal
  fileServiceObj.fileTypeDeleteModal().should('be.visible');
  fileServiceObj.fileTypeDeleteModalTitle().invoke('text').should('contains', 'Delete file type');
  fileServiceObj.fileTypeDeleteModalContent().invoke('text').should('contains', fileTypeName);
});

When('the user clicks Delete button on file type modal', function () {
  fileServiceObj.fileTypeDeleteModal().should('be.visible');
  fileServiceObj.fileTypeDeleteModalDeleteButton().scrollIntoView().click();
  cy.wait(2000); //Wait the file type list to refresh
});

//Find file type with name, read role(s) and update role(s)
//Input: file name, file read role(s) in a string separated with comma, file update role(s) in a string separated with comma
//Return: row number if the file type is found; zero if the file type isn't found
function findFileType(name, readRole, updateRole) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const readRoles = readRole.split(',');
      const updateRoles = updateRole.split(',');
      const targetedNumber = readRoles.length + updateRoles.length + 1; // Name, read roles and update roles all need to match to find the file type
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
            // cy.log(rowElement.cells[1].innerHTML); // Print out the read role cell innerHTML for debug purpose
            readRoles.forEach((rRole) => {
              if (rowElement.cells[1].innerHTML.includes(rRole.trim())) {
                counter = counter + 1;
              }
            });
            // cy.log(rowElement.cells[2].innerHTML); // Print out the update role cell innerHTML for debug purpose
            updateRoles.forEach((uRole) => {
              if (rowElement.cells[2].innerHTML.includes(uRole.trim())) {
                counter = counter + 1;
              }
            });
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

Then('the user views an error message for duplicated file name', function () {
  fileServiceObj.fileTypesErrorMessage().invoke('text').should('contain', 'status code 400');
});

Then('the user views file type current in user modal for {string}', function (fileTypeName) {
  fileServiceObj.fileTypeDeleteModalTitle().invoke('text').should('eq', 'File type current in use');
  fileServiceObj
    .fileTypeDeleteModalContent()
    .invoke('text')
    .should(
      'contain',
      'You are unable to delete the file type ' + fileTypeName + ' because there are files within the file type'
    );
});

When('the user clicks Okay button', function () {
  fileServiceObj.fileTypeDeleteModalOkayBtn().click();
  cy.wait(1000);
});
