import { getGreeting } from '../../support/app.po';
import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

import WelcomPage from './welcome.page';
import common from '../common/common.page';

const commonObj = new common();
const welcomPageObj = new WelcomPage();
let responseObj: Cypress.Response;
let tenantId;

When('the user goes to the tenant management welcome page', function () {
  const urlToSkipSSO = Cypress.config().baseUrl + '?kc_idp_hint=';
  cy.visit(urlToSkipSSO);
});

Then('the user views the tenant management welcome page title', function () {
  getGreeting().then((h1) => {
    expect(h1.length).to.be.gt(0); // h1 element exists
  });
});

Given('the user is on the tenant management welcome page', function () {
  const urlToSkipSSO = Cypress.config().baseUrl + '?kc_idp_hint=';
  cy.visit(urlToSkipSSO);
  getGreeting().then((h1) => {
    expect(h1.length).to.be.gt(0); // h1 element exists
  });
});

When('the user clicks the sign in button', function () {
  welcomPageObj.signinDiv().click();
});

Then('the user is logged in tenant management web app', function () {
  welcomPageObj.signoutDiv().contains('Sign Out');
  welcomPageObj.userIcon().next().contains('Sign Out'); //user icon is next to sign out
});

Then('the user views the page of {string} based on if the user created a tenant before or not', function (page) {
  switch (page) {
    case 'Tenant Login':
      welcomPageObj.realmHeader().invoke('text').should('be.a', 'string');
      commonObj.loginButton().invoke('val').should('eq', 'Log In');
      break;
    case 'Tenant Name':
      welcomPageObj.tenantNameLabel().then((element) => {
        expect(element.length).to.equal(1);
      });
      welcomPageObj.tenantNameInput().then((element) => {
        expect(element.length).to.equal(1);
      });
      welcomPageObj.loginButton().then((element) => {
        expect(element.length).to.equal(1);
      });
      break;
    default:
      expect(page).to.be.oneOf(['Tenant Login', 'Tenant Name']);
  }
});

When('the user selects get started button', function () {
  welcomPageObj.getStartedButton().click();
  cy.wait(5000); // Wait for the web app to check if the user has created a tenant or not
});

When('the user clicks continue with Government Alberta account button', function () {
  welcomPageObj.getStartedContinueButton().click();
  cy.wait(5000); // Wait for the web app to check if the user has created a tenant or not
});

Then('the user views a login page for an existing tenant', function () {
  welcomPageObj.realmHeader().invoke('text').should('be.a', 'string');
  commonObj.loginButton().invoke('val').should('eq', 'Log In');
});

Then('the user views a message of cannot create another tenant', function () {
  welcomPageObj.userHasOneTenantMessage().contains('has already created a tenant');
});

Then('the user views create tenant page', function () {
  welcomPageObj.createTenantTitle().contains('Create tenant');
});

When('the user enters {string} as tenant name and clicks create tenant button', function (tenantName) {
  welcomPageObj.tenantNameField().type(tenantName);
  welcomPageObj.createTenantButton().click();
  cy.wait(20000); // Wait the tenant creation to finish
});

Then('the user views the tenant is successfully created message', function () {
  welcomPageObj.newTenantCreationMessage().contains('successfully created');
});

Then('the new tenant login button is presented', function () {
  welcomPageObj.tenantLoginButton().contains('Tenant Login');
});

When('the user sends the delete tenant request', function () {
  expect(tenantId).not.equals(null);
  const tenantDeleteRequestURL = Cypress.env('tenantManagementApi') + '/api/tenant/v1?realm=' + tenantId;
  cy.request({
    method: 'DELETE',
    url: tenantDeleteRequestURL,
    auth: {
      bearer: Cypress.env('core-api-token'),
    },
  }).then(function (response) {
    responseObj = response;
  });
});

Then('the new tenant is deleted', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body.success).to.equal(true);
});

When('the user clicks the tenant login button', function () {
  welcomPageObj.tenantLoginButton().click();
});

Then('the user views the tenant login page for {string}', function (tenantName) {
  welcomPageObj.tenantLoginTenantDisplayName().invoke('text').should('eq', tenantName);
  cy.url().then(function (urlString) {
    // Store tenant id to be used by the later tenant deletion requrest step
    tenantId = urlString.match(/(?<=auth\/realms\/).+(?=\/protocol\/openid-connect\/auth)/g);
    expect(tenantId).not.equals(null);
    // Output to cypress console for information only
    Cypress.log({
      name: 'New tenant ID: ',
      message: tenantId,
    });
  });
});
