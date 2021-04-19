/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable cypress/no-unnecessary-waiting */
import { getGreeting } from '../../support/app.po';
import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

import WelcomPage from './welcome.page';
import common from '../common/common.page';

const commonObj = new common();
const welcomPageObj = new WelcomPage();
let responseObj: Cypress.Response;

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
});

Given('a user who {string} already created a tenant is logged in on the tenant management landing page', function (
  hasOrNot
) {
  const urlToSkipSSO = Cypress.config().baseUrl + '?kc_idp_hint=';
  cy.visit(urlToSkipSSO);
  welcomPageObj.signinDiv().click();
  cy.wait(5000); // Wait all the redirects to settle down
  if (hasOrNot == 'has') {
    commonObj.usernameEmailField().type(Cypress.env('email'));
    commonObj.passwordField().type(Cypress.env('password'));
  } else if (hasOrNot == 'has not') {
    commonObj.usernameEmailField().type(Cypress.env('email2'));
    commonObj.passwordField().type(Cypress.env('password2'));
  } else {
    expect.fail('Only has or has not can be passed in to this step. Got ' + hasOrNot);
  }
  commonObj.loginButton().click();
  cy.wait(5000); // Wait all the redirects to settle down
});

When('the user selects get started button', function () {
  welcomPageObj.getStartedButton().click();
  cy.wait(5000); // Wait for the web app to check if the user has created a tenant or not
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
  cy.wait(10000); // Wait the tenant creation to finish
});

Then('the user views the tenant is successfully created message', function () {
  welcomPageObj.newTenantCreationMessage().contains('successfully created');
});

Then('the new tenant login button is presented', function () {
  welcomPageObj.tenantLoginButton().contains('Tenant Login');
});

When('the user sends the delete tenant request for {string}', function (request) {
  const tenantAdminBackendTokenRequestURL =
    Cypress.env('accessManagementApi') + '/realms/core' + Cypress.env('keycloakTokenUrlSuffix');
  cy.request({
    method: 'POST',
    url: tenantAdminBackendTokenRequestURL,
    body: {
      client_id: Cypress.env('tenant-admin-backend-client-id'),
      client_secret: Cypress.env('tenant-admin-backend-client-secret'),
      grant_type: 'client_credentials',
    },
    form: true,
  }).then((response) => {
    Cypress.env('tenant-admin-backend-token', response.body.access_token);
    const tenantDeleteRequestURL = Cypress.env('tenantManagementApi') + '/api/realm/v1?realm=' + request;
    cy.request({
      method: 'DELETE',
      url: tenantDeleteRequestURL,
      auth: {
        bearer: Cypress.env('tenant-admin-backend-token'),
      },
    }).then(function (response) {
      responseObj = response;
    });
  });
});

Then('the new tenant is deleted', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('status').to.contain('ok');
});
