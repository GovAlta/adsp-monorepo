import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import fd = require('form-data');
import axios, { AxiosResponse } from 'axios';
import commonlib from '../common/common-library';
import fileServicePage from './file-service.page';
import tenantAdminPage from '../tenant-admin/tenant-admin.page';

const fileServiceObj = new fileServicePage();
const tenantAdminObj = new tenantAdminPage();
let responseObj: Cypress.Response;
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
  expect(responseObj.status).equals(202);
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
    // Get space id and type id
    let spaceId, typeId;
    const allTypesRequestURL = Cypress.env('fileApi') + '/file-type/v1/fileTypes';
    const fileUploadRequestURL = Cypress.env('fileApi') + reqEndPoint;
    cy.request({
      method: 'GET',
      url: allTypesRequestURL,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
    }).then(async function (response) {
      responseObj = response;
      // Get space id and type id from the array of all types for the current user
      for (let arrayIndex = 0; arrayIndex < response.body.length; arrayIndex++) {
        if (response.body[arrayIndex].name == fileTypeName) {
          spaceId = response.body[arrayIndex].spaceId;
          typeId = response.body[arrayIndex].id;
        }
      }
      // Output to cypress console for information only
      Cypress.log({
        name: 'File Type Id for "' + fileTypeName + '" : ',
        message: typeId,
      });
      Cypress.log({
        name: 'Space Id for "' + fileTypeName + '" : ',
        message: spaceId,
      });

      // File upload with the space id and type id
      const formData = new fd();
      formData.append('space', spaceId);
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
        cy.log(err);
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

Given('a service owner user is on file services overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  tenantAdminObj
    .dashboardMenuItem('/admin/tenant-admin/services/file')
    .click()
    .then(function () {
      cy.url().should('include', '/admin/tenant-admin/services/file');
      cy.wait(4000);
    });
});

When('the user {string} file service', function (action) {
  // Verify action
  expect(action).to.be.oneOf(['enables', 'disables']);
  // Check file services status
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

Then('user views file service api documentation', function () {
  // Verify the api titles
  fileServiceObj.fileTypesAPIsTitle().then((fileTypesAPITitle) => {
    expect(fileTypesAPITitle.length).to.be.gt(0); // title element exists
  });
  fileServiceObj.filesAPIsTitle().then((filesAPITitle) => {
    expect(filesAPITitle.length).to.be.gt(0); // title element exists
  });
});
