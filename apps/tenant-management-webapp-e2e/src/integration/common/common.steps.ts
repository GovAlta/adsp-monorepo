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
  cy.wait(8000); // Wait all the redirects to settle down
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
  cy.wait(8000); // Wait all the redirects to settle down
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

// Only a list of elements with matching element names are supported
Then('no critical or serious accessibility issues for {string} on {string}', function (elementName, pageName) {
  injectAxe();
  let elementIdentifier;
  switch (elementName) {
    case 'PDF template modal':
      elementIdentifier = '[data-testid="template-form"]';
      break;
    case 'script edit modal':
      elementIdentifier = '[data-testid="script-edit-form"]';
      break;
    case 'event template modal':
      elementIdentifier = '[data-testid="template-form"]';
      break;
    case 'configuration definition modal':
      elementIdentifier = '[data-testid="definition-form"]';
      break;
    case 'directory entry modal':
      elementIdentifier = '[data-testid="directory-modal"]';
      break;
    case 'event definition modal':
      elementIdentifier = '[data-testid="definition-form"]';
      break;
    case 'file type modal':
      elementIdentifier = '[data-testid="file-type-modal"]';
      break;
    case 'notification type modal':
      elementIdentifier = '[data-testid="notification-types-form"]';
      break;
    case 'select an event modal':
      elementIdentifier = '[data-testid="event-form"]';
      break;
    case 'edit notification contact information modal':
      elementIdentifier = '[data-testid="edit-contact-information-notification"]';
      break;
    case 'add PDF template modal':
      elementIdentifier = '[data-testid="template-form"]';
      break;
    case 'add script modal':
      elementIdentifier = '[data-testid="add-script-modal"]';
      break;
    case 'edit status contact information modal':
      elementIdentifier = '[data-testid="edit-contact-information-status"]';
      break;
    case 'add application modal':
      elementIdentifier = '[data-testid="add-application"]';
      break;
    case 'add notice modal':
      elementIdentifier = '[data-testid="notice-modal"]';
      break;
    default:
      expect(elementName).to.be.oneOf([
        'PDF template modal',
        'script edit modal',
        'event template modal',
        'configuration definition modal',
        'directory entry modal',
        'event definition modal',
        'file type modal',
        'notification type modal',
        'select an event modal',
        'add PDF template modal',
        'add script modal',
        'edit contact information modal',
        'add application modal',
        'add notice modal',
      ]);
  }
  // check all accessibility issues and generate a report without failing the step.
  cy.checkA11y(
    elementIdentifier,
    {},
    (violations) => {
      htmlReport(violations, true, pageName + ' - ' + elementName + '-all');
    },
    true
  );
  // check critical and serious accessibility issues and generate a report. Fail the step if there are any.
  cy.checkA11y(elementIdentifier, { includedImpacts: ['critical', 'serious'] }, (violations) => {
    htmlReport(violations, true, pageName + ' - ' + elementName + '-critical&serious');
  });
});

When('the user selects the {string} menu item', function (menuItem) {
  commonlib.tenantAdminMenuItem(menuItem, 2000);
});

Then('the user views the link of API docs for {string}', function (serviceName) {
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
  Cypress.config('defaultCommandTimeout', 20000); // Wait more time for checking API title
  commonObj.APIDocsPageTitle(serviceName).then((title) => {
    expect(title.length).to.be.gt(0); // element exists
  });
  Cypress.config('defaultCommandTimeout', 4000);
});

When('the user selects {string} tab for {string}', function (tab, menuItem) {
  commonObj.serviceTab(menuItem, tab).click();
  cy.wait(3000);
});

Then('the user views a notification message of {string}', function (message) {
  cy.wait(4000); // Wait for the message to show up
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
  commonObj
    .deleteConfirmationModalDeleteBtn()
    .shadow()
    .find('button')
    .scrollIntoView()
    .should('be.visible')
    .click({ force: true });
  cy.wait(4000); // Wait for the record to be removed from the page
});

When('the user waits {string} seconds', function (seconds) {
  expect(isNaN(seconds)).to.be.false; // Verify the pass in seconds is a number
  expect(Number(seconds)).to.be.lessThan(300); // provent user from passing in too big a number to hang the test execution
  cy.wait(Number(seconds) * 1000); // Wait N seconds
});

//serviceName parameter needs to be lower case with kebab format for See the code link
Then('the user views the link of See the code for {string}', function (serviceName) {
  commonObj
    .seeTheCodeLink()
    .should('have.attr', 'href')
    .then((href) => {
      expect(href).to.contain(serviceName);
    });
  commonObj.seeTheCodeIcon().should('be.visible');
});

Then('the user views the link of {string} under Support', function (asideLink) {
  commonObj
    .supportLink(asideLink)
    .should('have.attr', 'href')
    .then((href) => {
      expect(href).to.contain('mailto:adsp@gov.ab.ca');
    });
  commonObj.getSupportIcon().should('be.visible');
});

Then('the user views the {string} overview content {string}', function (serviceTitle, content) {
  commonObj.serviceOverviewContent(serviceTitle).invoke('text').should('contain', content);
});

When('the user clicks {string} button on unsaved changes modal', function (button) {
  switch (button) {
    case "Don't save":
      commonObj.dontSaveButtonUnsavedChangesModal().shadow().find('button').click({ force: true });
      break;
    case 'Save':
      commonObj.saveButtonUnsavedChangesModal().shadow().find('button').click({ force: true });
      break;
    case 'Cancel':
      commonObj.cancelButtonUnsavedChangesModal().shadow().find('button').click({ force: true });
      break;
    default:
      expect(button).to.be.oneOf(["Don't save", 'Save', 'Cancel']);
  }
  cy.wait(1000);
});
