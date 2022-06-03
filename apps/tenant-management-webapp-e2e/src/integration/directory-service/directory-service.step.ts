import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import DirectoryServicePage from './directory-service.page';
import Common from '../common/common.page';
import commonlib from '../common/common-library';

const directoryObj = new DirectoryServicePage();
const commonObj = new Common();

Then('the user views the Directory service overview content {string}', function (paragraphText) {
  directoryObj.directoryOverviewContent().invoke('text').should('contain', paragraphText);
});

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
  directoryObj.directoryTable().contains('td[data-testid="service"]', directoryName).siblings().contains(url);
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
  cy.wait(2000);
});

When('the user clicks Add entry button', function () {
  directoryObj.addEntryButton().click();
});

Then('the user views Add entry modal', function () {
  commonObj.modalTitle().invoke('text').should('eq', 'Add entry');
});

Then('the user views Edit entry modal', function () {
  commonObj.modalTitle().invoke('text').should('eq', 'Edit entry');
});

Then('the user views Delete entry modal for {string}', function (entryName) {
  commonObj.modalTitle().invoke('text').should('eq', 'Delete entry');
  directoryObj
    .deleteModalContent()
    .invoke('text')
    .should('eq', 'Delete ' + entryName + '?');
});

When('the user enters {string} in Service, {string} in API, {string} in URL', function (service, api, url) {
  directoryObj.entryModalServiceField().clear().type(service);
  if (api == 'Empty') {
    directoryObj.entryModalApiField().type(api).clear();
  } else {
    directoryObj.entryModalApiField().clear().type(api);
  }
  directoryObj.entryModalUrlField().clear().type(url);
});

When('the user modifies URL field {string}', function (url) {
  directoryObj.entryModalUrlField().scrollIntoView().clear().type(url);
});

When('the user modifies Service field {string}', function (serviceName) {
  directoryObj.entryModalServiceField().scrollIntoView().clear().type(serviceName);
});

Then('the user clicks Save button in Entry modal', function () {
  directoryObj.entryModalSaveButton().click();
  cy.wait(2000);
});

When('the user clicks Cancel button in Entry modal', function () {
  directoryObj.entryModalCancelButton().click();
});

Then(
  'the user {string} the entry of {string} in Service, {string} in API, {string} in URL',
  function (viewOrNot, entryName, api, url) {
    switch (viewOrNot) {
      case 'views':
        if (api == 'Empty') {
          directoryObj.directoryEntryWithNameUrl(entryName, url).should('exist');
        } else {
          directoryObj.directoryEntryWithNameApiUrl(entryName, api, url).should('exist');
        }
        break;
      case 'should not view':
        if (api == 'Empty') {
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
  if (api == 'Empty') {
    directoryObj.entryNameUrlEditIcon(entryName, url).click();
  } else {
    directoryObj.entryNameApiUrlEditIcon(entryName, api, url).click();
  }
  cy.wait(2000);
});

When('the user clicks Delete icon of {string}, {string}, {string} on entries page', function (entryName, api, url) {
  if (api == 'Empty') {
    directoryObj.entryNameUrlDeleteIcon(entryName, url).click();
  } else {
    directoryObj.entryNameApiUrlDeleteIcon(entryName, api, url).click();
  }
  cy.wait(2000);
});

When('the user clicks Delete button in Entry modal', function () {
  directoryObj.deleteModalDeleteBtn().scrollIntoView().click();
  cy.wait(2000);
});
