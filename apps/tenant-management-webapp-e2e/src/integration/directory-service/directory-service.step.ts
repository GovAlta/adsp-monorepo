import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import DirectoryServicePage from './directory-service.page';
import Common from '../common/common.page';
import commonlib from '../common/common-library';

const directoryObj = new DirectoryServicePage();
const commonObj = new Common();
let responseObj: Cypress.Response<any>;

Then('the user views the aside item {string} with the aside item link {string}', function (asideItem, asideLink) {
  directoryObj.directoryAsideItems(asideItem, asideLink).should('have.attr', 'href');
});

Then('the user views the service entry of {string} and {string}', function (directoryName, fileUrl) {
  let url = '';
  const envFileApi = fileUrl.match(/(?<={).+(?=})/g);
  if (envFileApi == '') {
    url = fileUrl;
  } else {
    url = Cypress.env(String(envFileApi));
  }
  directoryObj.directoryTable().get('td[data-testid="service"]').contains(directoryName).siblings().contains(url);
});

Given('a tenant admin user is on directory entries page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Directory', 4000);
  commonObj.serviceTab('Directory', 'Entries').click();
  cy.wait(4000);
});

When('the user clicks Add entry button', function () {
  directoryObj.addEntryButton().shadow().find('button').click({ force: true });
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user {string} Add entry modal', function (viewOrNot) {
  switch (viewOrNot) {
    case 'views':
      directoryObj.entryModalTitle().invoke('text').should('eq', 'Add entry');
      break;
    case 'should not view':
      directoryObj.entryModalTitle().should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

Then('the user views Edit entry modal', function () {
  directoryObj.entryModalTitle().invoke('text').should('eq', 'Edit entry');
});

Then('the user views Delete entry modal for {string}', function (entryName) {
  directoryObj.deleteModalTitle().invoke('text').should('eq', 'Delete entry');
  directoryObj
    .deleteModalContent()
    .invoke('text')
    .should('contain', 'Delete ' + entryName + '?');
});

When('the user enters {string} in Service, {string} in API, {string} in URL', function (service, api, url) {
  directoryObj.entryModalServiceField().shadow().find('input').clear().type(service, { delay: 50, force: true });
  if (api.toLowerCase() == 'empty') {
    directoryObj.entryModalApiField().shadow().find('input').clear();
  } else {
    directoryObj.entryModalApiField().shadow().find('input').clear().type(api, { delay: 50, force: true });
  }
  directoryObj.entryModalUrlField().shadow().find('input').clear().type(url, { delay: 50, force: true });
});

When('the user modifies URL field {string}', function (url) {
  directoryObj
    .entryModalUrlField()
    .shadow()
    .find('input')
    .scrollIntoView()
    .clear()
    .type(url, { delay: 50, force: true });
});

Then('the user clicks Save button in Entry modal', function () {
  directoryObj.entryModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks Cancel button in Entry modal', function () {
  directoryObj.entryModalCancelButton().shadow().find('button').click({ force: true });
});

Then(
  'the user {string} the entry of {string} in Service, {string} in API, {string} in URL',

  function (viewOrNot, entryName, api, url) {
    switch (viewOrNot) {
      case 'views':
        if (api.toLowerCase() == 'empty') {
          directoryObj.directoryEntryWithNameUrl(entryName, url).should('exist');
        } else {
          directoryObj.directoryEntryWithNameApiUrl(entryName, api, url).should('exist');
        }
        break;
      case 'should not view':
        cy.wait(2000);
        if (api.toLowerCase() == 'empty') {
          directoryObj.directoryEntryWithNameUrl(entryName, url).should('not.exist');
        } else {
          directoryObj.directoryEntryWithNameApiUrl(entryName, api, url).should('not.exist');
        }
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

Then('the user views the error message {string} for {string} field', function (errorMsg, field) {
  switch (field) {
    case 'Service':
      directoryObj.entryModalServiceFieldErrorMsg().invoke('text').should('eq', errorMsg);
      break;
    case 'Api':
      directoryObj.entryModalApiFieldErrorMsg().invoke('text').should('eq', errorMsg);
      break;
    case 'Url':
      directoryObj.entryModalUrlFieldErrorMsg().invoke('text').should('eq', errorMsg);
      break;
    default:
      expect(field).to.be.oneOf(['Service', 'Api', 'Url']);
  }
});

When('the user clicks Edit icon of {string}, {string}, {string} on entries page', function (entryName, api, url) {
  if (api.toLowerCase() == 'empty') {
    directoryObj.entryNameUrlEditIcon(entryName, url).shadow().find('button').click({ force: true });
  } else {
    directoryObj.entryNameApiUrlEditIcon(entryName, api, url).shadow().find('button').click({ force: true });
  }
  cy.wait(2000);
});

When('the user clicks Delete icon of {string}, {string}, {string} on entries page', function (entryName, api, url) {
  if (api.toLowerCase() == 'empty') {
    directoryObj.entryNameUrlDeleteIcon(entryName, url).shadow().find('button').click({ force: true });
  } else {
    directoryObj.entryNameApiUrlDeleteIcon(entryName, api, url).shadow().find('button').click({ force: true });
  }
  cy.wait(2000);
});

When('the user clicks Delete button in Entry modal', function () {
  directoryObj.deleteModalDeleteBtn().shadow().find('button').scrollIntoView().click({ force: true });
  cy.wait(2000);
});

When('the user clicks Eye icon for the service entry of {string}', function (serviceName) {
  directoryObj.entryNameEyeIcon(serviceName).shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views the metadata of service for {string}', function (serviceName) {
  directoryObj.directoryServiceMetadata(serviceName).should('not.be.empty');
});

When('the user clicks Eye icon to close metadata for the service entry of {string}', function (serviceName) {
  directoryObj.entryNameEyeOffIcon(serviceName).shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user clicks on Add from the action menu', function () {
  cy.wait(1000); // Wait for the + icon to show
  directoryObj.addEntryActionBtn().shadow().find('button').click({ force: true });
});

Then('the user views disabled inputs for Service, API and URL fields', function () {
  directoryObj.entryModalServiceField().shadow().find('input').should('be.disabled');
  directoryObj.entryModalApiField().shadow().find('input').should('be.disabled');
  directoryObj.entryModalUrlField().shadow().find('input').should('be.disabled');
});

When(
  'the user sends an anonymous request to directory service to get all {string} tenant service entries',
  function (tenant) {
    const requestURL = Cypress.env('directoryServiceApiUrl') + '/directory/v2/namespaces/' + tenant + '/entries';
    cy.request({
      method: 'GET',
      url: requestURL,
      failOnStatusCode: false,
    }).then(function (response) {
      responseObj = response;
    });
  }
);

Then('the user receives response with all services and their URLs for {string}', function (tenant) {
  // Response with 200 status code and an array
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.be.a('array');
  // Each array element contains tenant name as namespace, non-empty url and an urn with tenant name
  for (let i = 0; i < responseObj.body.length; i++) {
    expect(responseObj.body[i].namespace).to.equal(tenant);
    expect(responseObj.body[i].url).to.be.not.null;
    expect(responseObj.body[i].urn).to.contain('urn:ads:' + tenant);
  }
});
