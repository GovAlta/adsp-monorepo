import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

import WelcomPage from './welcome.page';
import common from '../common/common.page';

const commonObj = new common();
const welcomPageObj = new WelcomPage();
let responseObj: Cypress.Response<any>;
let tenantId;

When('the user goes to the tenant management welcome page', function () {
  const urlToSkipSSO = Cypress.config().baseUrl + '?kc_idp_hint=';
  cy.visit(urlToSkipSSO);
});

Then('the user views the tenant management welcome page title', function () {
  welcomPageObj.welcomePageTitle().should('contain.text', 'The Alberta Digital Service Platform (ADSP)');
});

Given('the user is on the tenant management welcome page', function () {
  const urlToSkipSSO = Cypress.config().baseUrl + '?kc_idp_hint=';
  cy.visit(urlToSkipSSO);
  welcomPageObj.welcomePageTitle().should('contain.text', 'The Alberta Digital Service Platform (ADSP)');
});

When('the user clicks the sign in button', function () {
  welcomPageObj.signinDiv().click();
  cy.wait(5000);
});

Then('the user is logged in tenant management web app', function () {
  welcomPageObj.signoutDiv().contains('Sign out');
  welcomPageObj.userIcon().next().contains('Sign out'); //user icon is next to sign out
});

Then('the user views the page of {string} based on if the user created a tenant before or not', function (page) {
  switch (page) {
    case 'Tenant Login':
      // welcomPageObj.realmHeader().invoke('text').should('be.a', 'string');
      commonObj.loginButton().invoke('val').should('eq', 'Sign In');
      break;
    case 'Tenant Creation':
      welcomPageObj.createTenantLinkButton().then((element) => {
        expect(element.length).to.equal(1);
      });
      break;
    default:
      expect(page).to.be.oneOf(['Tenant Login', 'Tenant Creation']);
  }
});

When('the user selects get started button', function () {
  // Click get started button and verify the button directs users to /get-started page
  welcomPageObj.getStartedButton().click();
  cy.url().should('include', '/get-started');
  // Pass in kc_idp_hint= to avoid SSO login
  cy.visit('/get-started?kc_idp_hint=');
  cy.wait(5000); // Wait for the web app to check if the user has created a tenant or not
});

When('the user clicks Sign in button', function () {
  welcomPageObj.getStartedSigninButton().click();
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

When(
  'the user enters {string} as tenant name, clicks create tenant button and waits {string} seconds',
  function (tenantName, seconds) {
    expect(isNaN(seconds)).to.be.false; // Verify the pass in seconds is a number
    expect(Number(seconds)).to.be.lessThan(300); // provent user from passing in too big a number to hange the test execution
    welcomPageObj.tenantNameField().clear().type(tenantName);
    welcomPageObj.createTenantButton().click();
    cy.wait(Number(seconds) * 1000); // Wait N seconds for the tenant creation
  }
);

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

Then('the user views the tenant login page', function () {
  // Verify the sign in title
  welcomPageObj.tenantSignInTitle().then((tenantSignInTitle) => {
    expect(tenantSignInTitle.length).to.be.gt(0); // title element exists
  });
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

Then('the user views a message of cannot create a tenant without beta-tester role', function () {
  // Tenant creation failed title
  welcomPageObj.tenantCreationFailedH1Title().then((h1Title) => {
    expect(h1Title.length).to.be.greaterThan(0); // Element exists
  });
  // Error message for the beta-tester role
  welcomPageObj
    .tenantCreationFailedErrorMessage()
    .invoke('text')
    .should('contain', 'You require the "beta-tester" role to create a tenant');
});

When('the user clicks back to sign in page button', function () {
  welcomPageObj.backToSignInPageLinkButton().click();
});

Then('the user views the error message of {string} for tenant creation', function (errorMsg) {
  welcomPageObj.createTenantNameErrorMsg().invoke('text').should('contain', errorMsg);
});
