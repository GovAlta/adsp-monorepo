import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import common from './common.page';

const commonObj = new common();

When('the user enters credentials and clicks login button', function () {
  commonObj.usernameEmailField().type(Cypress.env('email'));
  commonObj.passwordField().type(Cypress.env('password'));
  commonObj.loginButton().click();
  cy.wait(5000); // Wait all the redirects to settle down
});

When('the user enters {string} and {string}, and clicks login button', function (username, password) {
  let user = '';
  let pwd = '';
  // Get user name
  const envUsername = username.match(/(?<={).+(?=})/g);
  if (envUsername == '') {
    user = username;
  } else {
    user = Cypress.env(String(envUsername));
  }

  // Get password
  const envPassword = password.match(/(?<={).+(?=})/g);
  if (envPassword == '') {
    pwd = password;
  } else {
    pwd = Cypress.env(String(envPassword));
  }

  // Enter user name and password and click log in button
  commonObj.usernameEmailField().type(user);
  commonObj.passwordField().type(pwd);
  commonObj.loginButton().click();
  cy.wait(5000); // Wait all the redirects to settle down
});

Given('a service owner user is on tenant admin page', function () {
  const urlToTenantLogin = Cypress.config().baseUrl + '/' + Cypress.env('realm') + '/login';
  cy.visit(urlToTenantLogin);
  commonObj.tenantLoginButton().click();
  cy.wait(5000); // Wait all the redirects to settle down
  cy.url().then(function (urlString) {
    if (urlString.includes('openid-connect')) {
      commonObj.usernameEmailField().type(Cypress.env('email'));
      commonObj.passwordField().type(Cypress.env('password'));
      commonObj.loginButton().click();
      cy.wait(10000); // Wait all the redirects to settle down
    }
  });
  cy.url().should('include', '/tenant-admin');
});
