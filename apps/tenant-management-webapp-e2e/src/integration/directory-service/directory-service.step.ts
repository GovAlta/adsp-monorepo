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

Given('a tenant admin user is on directory entry page', function () {
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
  directoryObj.addEntryModalTitle().invoke('text').should('eq', 'Add entry');
});

When('the user enters {string} in Service, {string} in API, {string} in URL', function (service, api, url) {
  directoryObj.entryModalServiceField().type(service);
  if (api == 'Empty') {
    directoryObj.entryModalApiField().type(api).clear();
  } else {
    directoryObj.entryModalApiField().type(api);
  }
  directoryObj.entryModalApiField().type(api).clear();
  directoryObj.entryModalUrlField().type(url);
});

Then('the user clicks Save button', function () {
  directoryObj.entryModalSaveButton().click();
  cy.wait(2000);
});

Then('the user views the entry of {string}, {string}', function (directoryName, url) {
  directoryObj.directoryTable().contains('td[data-testid="service"]', directoryName).siblings().contains(url);
});

Then('the user views the error message of "autotest-addentry" exists', function (service) {
  // Service duplicate, please use another
});
