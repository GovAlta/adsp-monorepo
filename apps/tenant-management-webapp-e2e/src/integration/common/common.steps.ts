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

Given('a service owner user is on tenant admin page', function () {
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
  let menuItemSelector = '';
  switch (menuItem) {
    case 'Dashboard':
      menuItemSelector = '/admin';
      break;
    case 'Event log':
      menuItemSelector = '/admin/event-log';
      break;
    case 'File services':
      menuItemSelector = '/admin/services/files';
      break;
    case 'Access':
      menuItemSelector = '/admin/access';
      break;
    case 'Status':
      menuItemSelector = '/admin/services/status';
      break;
    case 'Events':
      menuItemSelector = '/admin/services/events';
      break;
    default:
      expect(menuItem).to.be.oneOf(['File services', 'Access', 'Status', 'Events']);
  }

  commonObj.adminMenuItem(menuItemSelector).click();
  cy.wait(2000); // wait for the page to load tenant data such as tenant user/role stats
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

When('the user selects {string} tab for {string}', function (tab, service) {
  commonObj.serviceTab(service, tab).click();
  cy.wait(3000);
});
