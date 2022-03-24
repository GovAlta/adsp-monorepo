import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import common from './common.page';
import commonlib from './common-library';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

const commonObj = new common();
let apiDocsLink;

When('the user enters credentials and clicks login button', function () {
  commonObj.usernameEmailField().type(Cypress.env('email'));
  commonObj.passwordField().type(Cypress.env('password'));
  commonObj.loginButton().click();
  cy.wait(10000); // Wait all the redirects to settle down
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
  cy.wait(10000); // Wait all the redirects to settle down
});

Given('a tenant admin user is on tenant admin page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
});

Then('no critical or serious accessibility issues on {string}', function (pageName) {
  injectAxe();
  // check all accessibility issues and generate a report without failing the step.
  cy.checkA11y(
    null!,
    {},
    (violations) => {
      htmlReport(violations, true, pageName + '-all');
    },
    true
  );
  // check critical and serious accessibility issues and generate a report. Fail the step if there are any.
  cy.checkA11y(null!, { includedImpacts: ['critical', 'serious'] }, (violations) => {
    htmlReport(violations, true, pageName + '-critical&serious');
  });
});

When('the user selects the {string} menu item', function (menuItem) {
  commonlib.tenantAdminMenuItem(menuItem, 2000);
});

Then('the user views the link for {string} API docs', function (serviceName) {
  commonObj
    .readTheApiDocsLink()
    .should('have.attr', 'href')
    .then((href) => {
      expect(href).to.contain(serviceName);
      apiDocsLink = href;
    });
});

When('the user goes to the web link of the API docs', function () {
  cy.visit(apiDocsLink);
});

Then('the user views {string} API documentation', function (serviceName) {
  commonObj.APIDocsPageTitle(serviceName).then((title) => {
    expect(title.length).to.be.gt(0); // element exists
  });
});

When('the user selects {string} tab for {string}', function (tab, menuItem) {
  let service;
  // Convert menu item name to service title
  if (menuItem == 'Files') {
    service = 'File service';
  } else if (menuItem == 'Status') {
    service = 'Service status';
  } else if (menuItem == 'directory') {
    service = 'Directory service';
  } else {
    service = menuItem;
  }
  commonObj.serviceTab(service, tab).click();
  cy.wait(3000);
});

Then('the user views a callout message of {string}', function (message) {
  cy.wait(1000); // Wait for the message to show up
  commonObj.notificationMessage().invoke('text').should('contain', message);
});

Then('the user views delete {string} confirmation modal for {string}', function (deleteItemType, deleteItemName) {
  commonObj
    .deleteConfirmationModalTitle()
    .invoke('text')
    .should('eq', 'Delete ' + deleteItemType);
  commonObj.deleteConfirmationModalContent().invoke('text').should('contains', deleteItemName);
});

When('the user clicks Delete button in delete confirmation modal', function () {
  commonObj.deleteConfirmationModalDeleteBtn().click();
});

When('the user waits {string} seconds', function (seconds) {
  expect(isNaN(seconds)).to.be.false; // Verify the pass in seconds is a number
  expect(Number(seconds)).to.be.lessThan(300); // provent user from passing in too big a number to hange the test execution
  cy.wait(Number(seconds) * 1000); // Wait N seconds for the tenant creation
});
