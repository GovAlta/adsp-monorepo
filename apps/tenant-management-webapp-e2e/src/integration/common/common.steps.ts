import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import common from './common.page';
import commonlib from './common-library';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';
import events from '../events/events.page';
import tenantAdminPage from '../tenant-admin/tenant-admin.page';
import TaskPage from '../task/task.page';
import ServiceStatusPage from '../service-status/service-status.page';
import NotificationsPage from '../notifications/notifications.page';

let formId;
let replacementString;

import dayjs = require('dayjs');

const commonObj = new common();
const tenantAdminObj = new tenantAdminPage();
const taskObj = new TaskPage();
const statusObj = new ServiceStatusPage();
const notificationsObj = new NotificationsPage();
let apiDocsLink;
let responseObj: Cypress.Response<any>;

When('the user enters credentials and clicks login button', function () {
  commonObj.usernameEmailField().type(Cypress.env('email'));
  commonObj.passwordField().type(Cypress.env('password'));
  commonObj.loginButton().click();
  cy.wait(8000); // Wait all the redirects to settle down
});

When('the user enters {string} and {string}, and clicks login button', function (username: string, password: string) {
  let user = '';
  let pwd = '';
  // Get user name
  const envUsername = username.match(/(?<={).+(?=})/g);
  if (!envUsername) {
    user = username;
  } else {
    user = Cypress.env(String(envUsername));
  }

  // Get password
  const envPassword = password.match(/(?<={).+(?=})/g);
  if (!envPassword) {
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
      elementIdentifier = '[testid="template-form"]';
      break;
    case 'configuration definition modal':
      elementIdentifier = '[testid="definition-form"]';
      break;
    case 'directory entry modal':
      elementIdentifier = '[testid="directory-modal"]';
      break;
    case 'event definition modal':
      elementIdentifier = '[testid="definition-form"]';
      break;
    case 'file type modal':
      elementIdentifier = '[testid="file-type-modal"]';
      break;
    case 'notification type modal':
      elementIdentifier = '[testid="notification-types-form"]';
      break;
    case 'select an event modal':
      elementIdentifier = '[testid="event-form"]';
      break;
    case 'edit notification contact information modal':
      elementIdentifier = '[testid="edit-contact-information-notification"]';
      break;
    case 'add PDF template modal':
      elementIdentifier = '[testid="template-form"]';
      break;
    case 'add script modal':
      elementIdentifier = '[testid="add-script-modal"]';
      break;
    case 'edit status contact information modal':
      elementIdentifier = '[testid="edit-contact-information-status"]';
      break;
    case 'add application modal':
      elementIdentifier = '[testid="add-application"]';
      break;
    case 'add notice modal':
      elementIdentifier = '[testid="notice-modal"]';
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
  if (String(deleteItemName).includes('<$ph>')) {
    deleteItemName = commonlib.stringReplacement(deleteItemName, replacementString);
  }
  cy.wait(4000);
  commonObj
    .deleteConfirmationModalTitle()
    .invoke('text')
    .should('eq', 'Delete ' + deleteItemType);
  commonObj.deleteConfirmationModalContent().invoke('text').should('contains', deleteItemName);
});

When('the user clicks Delete button in delete confirmation modal', function () {
  commonObj.deleteConfirmationModalDeleteBtn().shadow().find('button').scrollIntoView().click({ force: true });
  cy.wait(2000); // Wait for the record to be removed from the page
});

When('the user clicks Cancel button in delete confirmation modal', function () {
  commonObj
    .deleteConfirmationModalCancelBtn()
    .shadow()
    .find('button')
    .scrollIntoView()
    // .should('be.visible')  // Not working with form disposition modal
    .click({ force: true });
  cy.wait(4000); // Wait for the record to be removed from the page
});

When('the user waits {string} seconds', function (seconds: number) {
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
  commonObj.seeTheCodeIcon().scrollIntoView().should('be.visible');
});

Then('the user views the link of {string} under Support', function (asideLink) {
  commonObj
    .supportLink(asideLink)
    .should('have.attr', 'href')
    .then((href) => {
      expect(href).to.contain('mailto:adsp@gov.ab.ca');
    });
  commonObj.getSupportIcon().scrollIntoView().should('be.visible');
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

When('the user re-load the page and wait {string} seconds', function (numberOfSeconds) {
  cy.reload();
  cy.wait(Number(numberOfSeconds));
});

When('the user clicks Load more button on the page', function () {
  commonObj.loadMoreButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the {string} landing page is displayed', function (pageTitle) {
  let urlPart = 'undefined';
  switch (pageTitle) {
    case 'File service':
      urlPart = '/admin/services/file';
      break;
    case 'Status service':
      urlPart = '/admin/services/status';
      break;
    case 'Event log':
      urlPart = '/admin/event-log';
      break;
    default:
      expect(pageTitle).to.be.oneOf(['File service', 'Status service', 'Event log']);
  }
  cy.url().should('include', urlPart);
  tenantAdminObj.servicePageTitle(pageTitle).then((title) => {
    expect(title.length).to.be.gt(0); // element exists
  });
});

// Event definition
const eventsObj = new events();
When('the user clicks Add definition button on event definitions page', function () {
  eventsObj.addDefinitionButton().shadow().find('button').click({ force: true });
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Add definition dialog', function () {
  eventsObj.definitionModalTitle().invoke('text').should('eq', 'Add definition');
});

When(
  'the user enters {string} in Namespace, {string} in Name, {string} in Description',
  function (namespace: string, name: string, desc: string) {
    const currentTime = new Date();
    replacementString =
      '-' +
      ('0' + currentTime.getMonth()).substr(-2) +
      ('0' + currentTime.getDate()).substr(-2) +
      ('0' + currentTime.getHours()).substr(-2) +
      ('0' + currentTime.getHours()).substr(-2) +
      ('0' + currentTime.getSeconds()).substr(-2);
    name = commonlib.stringReplacement(name, replacementString);
    eventsObj
      .definitionModalNamespaceField()
      .shadow()
      .find('input')
      .clear()
      .type(namespace, { delay: 100, force: true });
    eventsObj.definitionModalNameField().shadow().find('input').clear().type(name, { delay: 50, force: true });
    eventsObj.definitionModalDescriptionField().shadow().find('textarea').type(desc);
  }
);

When('the user clicks Save button on Definition modal', function () {
  eventsObj.definitionModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then(
  'the user {string} an event definition of {string} and {string} under {string}',
  function (viewOrNot, eventName, eventDesc, eventNamespace) {
    eventName = commonlib.stringReplacement(eventName, replacementString);
    switch (viewOrNot) {
      case 'views':
        eventsObj.eventWithDesc(eventNamespace, eventName, eventDesc).should('exist');
        break;
      case 'should not view':
        eventsObj.eventWithDesc(eventNamespace, eventName, eventDesc).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

When(
  'the user clicks {string} button for the definition of {string} and {string} under {string}',
  function (button, eventName, eventDesc, eventNamespace) {
    eventName = commonlib.stringReplacement(eventName, replacementString);
    switch (button) {
      case 'Edit':
        eventsObj
          .editDefinitionButton(eventNamespace, eventName, eventDesc)
          .shadow()
          .find('button')
          .click({ force: true });
        break;
      case 'Delete':
        eventsObj
          .deleteDefinitionButton(eventNamespace, eventName, eventDesc)
          .shadow()
          .find('button')
          .click({ force: true });
        break;
      default:
        expect(button).to.be.oneOf(['Edit', 'Delete']);
    }
  }
);

When(
  'the user sends a request to set active revision to {string} for {string} under {string}',
  function (activeVersion: string, name, namespace) {
    const requestURL =
      Cypress.env('configurationServiceApiUrl') + '/configuration/v2/configuration/' + namespace + '/' + name;
    cy.request({
      method: 'POST',
      url: requestURL,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
      body: {
        operation: 'SET-ACTIVE-REVISION',
        setActiveRevision: parseInt(activeVersion),
      },
    }).then(function (response) {
      responseObj = response;
    });
  }
);

Then(
  'the user gets a response of active revision for {string} under {string} being {string}',
  function (name, namespace, activeVersion: string) {
    expect(responseObj.status).to.eq(200);
    expect(responseObj.body).to.have.property('namespace').to.contain(namespace);
    expect(responseObj.body).to.have.property('name').to.contain(name);
    expect(responseObj.body).to.have.property('active').to.equal(parseInt(activeVersion));
  }
);

// Event log steps:
Given('an admin user is on event log page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Event log', 4000);
});

When('the user searches with {string}', function (namespaceName: string) {
  tenantAdminObj.eventLogSearchBox().click();
  tenantAdminObj.eventLogSearchBox().type(namespaceName);
  tenantAdminObj.eventLogSearchBox().should('have.value', namespaceName);
  tenantAdminObj.eventLogSearchBtn().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

//dayjs is date time utility to format the date time
//replace "now-5mins" with "2022-01-09T04:02" to input absolute timestamp as static date and time
//checking and converting datetime into the string to check if it is static time or now-+mins format
//in case if it is static
function timestampUtil(dateTime) {
  if (
    String(dateTime).match(/[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/)
  ) {
    //if static datetime used as an input, use following format "2022-01-07T04:02"
    return dateTime;
  } else if (String(dateTime).match(/now([-+])([0-9]+)mins/)) {
    //if it is not static datetime we need to parse to match input field +- mins, use following format "now+-5mins"
    const addedMins = String(dateTime).substring(
      String(dateTime).search(/([+-])([0-9])/),
      String(dateTime).search(/mins/)
    );
    const minInput = addedMins.replace(/([a-zA-Z])/g, '');
    const minChange = parseInt(minInput);
    const finalTime = dayjs().add(minChange, 'minutes').second(0).format('YYYY-MM-DD HH:mm'); //it will add or subtract, force the seconds to be 00.

    const finalDate = finalTime.split(' ')[0] + 'T' + finalTime.split(' ')[1];
    return finalDate;
  } else {
    expect(String(dateTime)).to.match(
      /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
    );
  }
}

When('the user searches with {string} as minimum timestamp, {string} as maximum timestamp', function (submin, addmin) {
  //for example replace "now-+5mins" with "2022-01-09T04:02" to input absolute timestamp as static date and time
  expect(submin).to.match(
    /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
  );
  expect(addmin).to.match(
    /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
  );
  const timestampMin = timestampUtil(submin);
  const timestampMax = timestampUtil(addmin);

  cy.log(timestampMin);
  cy.log(timestampMax);

  tenantAdminObj.eventLogMinTimeStamp().type(timestampMin);
  tenantAdminObj.eventLogMaxTimeStamp().type(timestampMax);
  tenantAdminObj.eventLogSearchBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When(
  'the user searches with {string}, {string} as minimum timestamp, {string} as maximum timestamp',
  function (namespaceName: string, submin, addmin) {
    tenantAdminObj.eventLogSearchBox().click();
    tenantAdminObj.eventLogSearchBox().type(namespaceName);

    const timestampMin = timestampUtil(submin);
    const timestampMax = timestampUtil(addmin);

    cy.log(timestampMin);
    cy.log(timestampMax);

    tenantAdminObj.eventLogMinTimeStamp().type(timestampMin);
    tenantAdminObj.eventLogMaxTimeStamp().type(timestampMax);
    tenantAdminObj.eventLogSearchBtn().shadow().find('button').click({ force: true });
    cy.wait(2000);
  }
);

When(
  'the user clicks Show details button for the latest event of {string} for {string}',
  function (name: string, namespace: string) {
    // Verify the first record matches the name and namespace
    tenantAdminObj
      .eventTableBody()
      .children('tr')
      .first()
      .within(() => {
        tenantAdminObj.eventTableNameCells().invoke('text').should('eq', name);
      });
    tenantAdminObj
      .eventTableBody()
      .children('tr')
      .first()
      .within(() => {
        tenantAdminObj.eventTableNameSpaceCells().invoke('text').should('eq', namespace);
      });

    // Verify the first toggle details icon is eye icon, not eye-off icon, and then click it
    tenantAdminObj.eventToggleDetailsIcons().first().invoke('attr', 'icon').should('eq', 'eye');
    tenantAdminObj.eventToggleDetailsIcons().first().shadow().find('button').click({ force: true });
    cy.wait(1000);
    // Sometimes, after clicking details eye icon, the details panel is automatically collapsed, so we need to click it again
    let isEye = true;
    for (let i = 0; i < 10; i++) {
      tenantAdminObj
        .eventToggleDetailsIcons()
        .first()
        .then(($element) => {
          if ($element.attr('icon') == 'eye') {
            cy.log('Clicking the first eye icon again to show event details');
            tenantAdminObj.eventToggleDetailsIcons().first().shadow().find('button').click({ force: true });
            cy.wait(1000);
          } else {
            cy.log('The first eye icon is showing eye-off, event details should be shown');
            isEye = false;
          }
        });
      if (!isEye) {
        break;
      }
    }
  }
);

Then(
  'the user views event details of {string}, {string} of application-notice-published for status-service',
  function (noticeDesc, appName) {
    const regex_notice_description = '"notice": {(.|\n)*"description": "' + noticeDesc + '"';
    const regex_notice_endTimestamp = '"notice": {(.|\n)*"endTimestamp": ".+Z"';
    const regex_notice_startTimestamp = '"notice": {(.|\n)*"startTimestamp": ".+Z"';
    const regex_postedBy_userId = '"postedBy": {(.|\n)*"userId": ".+"';
    const regex_postedBy_userName = '"postedBy": {(.|\n)*"userName": ".+"';
    const regex_application_id = '"application": {(.|\n)*"id": ".+"';
    const regex_application_name = '"application": {(.|\n)*"name": "' + appName + '"';
    const regex_application_description = '"application": {(.|\n)*"description": ".*"';
    tenantAdminObj.eventDetails().then((elements) => {
      expect(elements.length).to.equal(1);
    });
    tenantAdminObj
      .eventDetails()
      .invoke('text')
      .then((eventDetails) => {
        // Verify all required information showing in event details including notice description and application name.
        expect(eventDetails).to.match(new RegExp(regex_notice_description));
        expect(eventDetails).to.match(new RegExp(regex_notice_endTimestamp));
        expect(eventDetails).to.match(new RegExp(regex_notice_startTimestamp));
        expect(eventDetails).to.match(new RegExp(regex_postedBy_userId));
        expect(eventDetails).to.match(new RegExp(regex_postedBy_userName));
        expect(eventDetails).to.match(new RegExp(regex_application_id));
        expect(eventDetails).to.match(new RegExp(regex_application_name));
        expect(eventDetails).to.match(new RegExp(regex_application_description));
      });
  }
);

Then(
  'the user views event details of {string}, {string}, {string}, {string} of active-revision-set for configuration-service',
  function (namespace, name, from: string, to: string) {
    tenantAdminObj
      .eventDetails()
      .invoke('text')
      .then((eventDetails) => {
        expect(eventDetails).to.contain('"from": ' + parseInt(from));
        expect(eventDetails).to.contain('"revision": ' + parseInt(to));
        expect(eventDetails).to.contain('"namespace": ' + '"' + namespace + '"');
        expect(eventDetails).to.contain('"name": ' + '"' + name + '"');
      });
  }
);

Then('the user views the events matching the search filter of {string}', function (namespaceName: string) {
  tenantAdminObj.eventTableBody().each(($row) => {
    cy.wrap($row).within(() => {
      cy.get('td').each(($col) => {
        if ($col.eq(2).text() == namespaceName.split(':')[0]) {
          expect($col.eq(2).text()).to.equal(namespaceName.split(':')[0]);
        }
        if ($col.eq(3).text() == namespaceName.split(':')[1]) {
          expect($col.eq(3).text()).to.equal(namespaceName.split(':')[1]);
        }
      });
    });
  });
});

Then(
  'the user views the event details of {string} application status changed from {string} to {string} for subscriber of {string}',
  function (appName, orgStatus, newStatusInput, email) {
    let isFound = false;
    let orgStatusValidationString;
    let newStatusValidationString;

    if (orgStatus != '{original status}') {
      orgStatusValidationString = orgStatus;
      if (orgStatusValidationString == 'reported issues') {
        orgStatusValidationString = 'reported-issues';
      }
    } else {
      cy.task('getOriginalAppStatus').then((appStatus) => {
        orgStatusValidationString = appStatus;
        if (orgStatusValidationString == 'reported issues') {
          orgStatusValidationString = 'reported-issues';
        }
      });
    }
    if (newStatusInput != '{new status}') {
      newStatusValidationString = newStatusInput;
      if (newStatusValidationString == 'reported issues') {
        newStatusValidationString = 'reported-issues';
      }
    } else {
      cy.task('getNewAppStatus').then((appStatus) => {
        newStatusValidationString = appStatus;
        if (newStatusValidationString == 'reported issues') {
          newStatusValidationString = 'reported-issues';
        }
      });
    }

    tenantAdminObj.eventToggleDetailsIcons().each(($element, $index, $full_array) => {
      //clicking each eye-icon in the list to verify event details
      cy.wrap($element).scrollIntoView();
      cy.wrap($element).shadow().find('button').click({ force: true });
      tenantAdminObj
        .eventDetails()
        .invoke('text')
        .then((eventDetails) => {
          // Check if event log details contains expected info
          if (
            eventDetails.includes('to": "' + email) &&
            eventDetails.includes(appName + ' status changed to') &&
            eventDetails.includes(
              'from <b>' +
                orgStatusValidationString.toLowerCase() +
                '</b> to <b>' +
                newStatusValidationString.toLowerCase() +
                '</b>'
            )
          ) {
            isFound = true;
            cy.wrap($element).click({ force: true });
          } else {
            //clicking eye icon to close event details
            cy.wrap($element).scrollIntoView();
            cy.wrap($element).click({ force: true });
          }
          if (isFound == false && $index + 1 == $full_array.length) {
            expect($index + 1).to.not.eq(
              $full_array.length,
              'No matching email found throughout list of event details'
            );
          }
        });
    });
  }
);

Then(
  'the user views the event details of {string}, {string}, {string}, {string}, {string}',
  function (serviceName, apiVersion, url, namespace, username) {
    tenantAdminObj.eventDetails().then((elements) => {
      expect(elements.length).to.equal(1);
    });
    tenantAdminObj
      .eventDetails()
      .invoke('text')
      .then((eventDetails) => {
        expect(eventDetails).to.contain('"URL": ' + '"' + url + '"');
        expect(eventDetails).to.contain('"api": ' + '"' + apiVersion + '"');
        expect(eventDetails).to.contain('"service": ' + '"' + serviceName + '"');
        expect(eventDetails).to.contain('"namespace": ' + '"' + namespace + '"');
        expect(eventDetails).to.contain('"name": ' + '"' + username + '"');
      });
  }
);

Then(
  'the user views the event details for the configuration-updated event to have {string} as the securityClassification value',
  function (securityClassification: string) {
    tenantAdminObj.eventDetails().then((elements) => {
      expect(elements.length).to.equal(1);
    });
    tenantAdminObj
      .eventDetails()
      .invoke('text')
      .then((eventDetails) => {
        expect(eventDetails).to.contain(
          '"securityClassification": ' + '"' + securityClassification.toLowerCase() + '"'
        );
      });
  }
);

// Only one event details is open before calling this step
Then(
  'the user views the event details with status changing from {string} to {string}',
  function (oldStatus: string, newStatus: string) {
    tenantAdminObj.eventDetails().then((elements) => {
      expect(elements.length).to.equal(1);
    });
    tenantAdminObj
      .eventDetails()
      .invoke('text')
      .then((eventDetails) => {
        expect(eventDetails).to.contain('"originalStatus": ' + '"' + oldStatus.toLowerCase() + '"');
        expect(eventDetails).to.contain('"newStatus": ' + '"' + newStatus.toLowerCase() + '"');
      });
  }
);

// Task steps:
Given('all existing tasks in {string} if any have been deleted', function (queue) {
  const getTasksRequestURL =
    Cypress.env('taskServiceApiUrl') + '/task/v1/queues/' + Cypress.env('tenantName') + '/' + queue + '/tasks';
  cy.request({
    method: 'GET',
    url: getTasksRequestURL,
    auth: {
      bearer: Cypress.env('autotest-admin-token'),
    },
  }).then((response) => {
    cy.log('Number of existing tasks: ' + response.body.results.length);
    for (let arrayIndex = 0; arrayIndex < response.body.results.length; arrayIndex++) {
      cy.log(
        'task #' +
          String(arrayIndex + 1) +
          ': ' +
          response.body.results[arrayIndex].name +
          '; ' +
          response.body.results[arrayIndex].id +
          '; ' +
          response.body.results[arrayIndex].status
      );
      if (response.body.results[arrayIndex].status.includes('Pending')) {
        const cancelTasksRequestURL =
          Cypress.env('taskServiceApiUrl') +
          '/task/v1/queues/' +
          Cypress.env('tenantName') +
          '/' +
          queue +
          '/tasks/' +
          response.body.results[arrayIndex].id;
        cy.request({
          method: 'POST',
          url: cancelTasksRequestURL,
          auth: {
            bearer: Cypress.env('autotest-admin-token'),
          },
          body: {
            operation: 'cancel',
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      }
    }
  });
});

Given('a tenant admin user is on task service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Task', 4000);
});

When('the user selects {string} in Select a queue dropdown', function (dropdownItem: string) {
  taskObj
    .tasksSelectAQueueDropdown()
    .invoke('attr', 'value')
    .then((dropdownValue) => {
      if (!dropdownValue?.includes(dropdownItem)) {
        taskObj.tasksSelectAQueueDropdown().shadow().find('input').click({ force: true });
        cy.wait(1000);
        taskObj.tasksSelectAQueueDropdown().shadow().find('li').contains(dropdownItem).click({ force: true });
        cy.wait(2000);
      } else {
        cy.log('Select a queue dropdown item is already selected: ' + dropdownItem);
      }
    });
});

Then('the user {string} the task of {string}, {string} on tasks page', function (viewOrNot, taskName, formName) {
  switch (viewOrNot) {
    case 'views':
      taskObj.tasksTaskRecord(taskName, formName).should('exist');
      break;
    case 'should not view':
      taskObj.tasksTaskRecord(taskName, formName).should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

// Form api
Given('the user deletes any existing form from {string} for {string}', function (userAddressAs, formDefinitionId) {
  let formId = 'NoFormFound';
  const requestURLGetForms =
    Cypress.env('formServiceApiUrl') + '/form/v1/forms?criteria={"definitionIdEquals":"' + formDefinitionId + '"}';
  cy.request({
    method: 'GET',
    url: requestURLGetForms,
    auth: {
      bearer: Cypress.env('autotest-admin-token'),
    },
  })
    .then((response) => {
      for (let arrayIndex = 0; arrayIndex < response.body.results.length; arrayIndex++) {
        cy.log(
          'form #' +
            String(arrayIndex + 1) +
            ': ' +
            response.body.results[arrayIndex].createdBy.name +
            '; ' +
            response.body.results[arrayIndex].id
        );
        if (response.body.results[arrayIndex].createdBy.name.includes(userAddressAs)) {
          formId = response.body.results[arrayIndex].id;
        }
      }
    })
    .then(() => {
      cy.log('Form id found: ' + formId);
      if (formId !== 'NoFormFound') {
        const requestURLDeleteForm = Cypress.env('formServiceApiUrl') + '/form/v1/forms/' + formId;
        cy.request({
          method: 'DELETE',
          url: requestURLDeleteForm,
          auth: {
            bearer: Cypress.env('autotest-admin-token'),
          },
        });
      }
    });
});

// Form app:
When('the user is logged in to see {string} application', function (formDefinition) {
  cy.visit(Cypress.env('formAppUrl') + Cypress.env('tenantName') + '/' + formDefinition + '/login?kc_idp_hint=');
  cy.wait(2000);
  // Enter user name and password and click log in button if login page shows
  cy.url().then((url) => {
    if (url.includes('auth/realms/')) {
      commonObj.formAppUsernameEmailField().type(Cypress.env('email'));
      commonObj.formAppPasswordField().type(Cypress.env('password'));
      commonObj.formAppLoginButton().click();
    }
  });
  cy.wait(10000); // Wait all the redirects to settle down
});

Then('the user views a from draft of {string}', function (formDefinition) {
  cy.url().should('include', formDefinition);
  cy.url().then((url) => {
    formId = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(formId).to.be.not.null;
  });
  cy.viewport(1920, 1080);
});

When('the user enters {string} in a text field labelled {string}', function (text: string, label) {
  commonObj.formAppFormTextField(label).shadow().find('input').clear().type(text, { force: true, delay: 200 });
});

When('the user clicks submit button in the form', function () {
  cy.wait(4000);
  commonObj.formAppFormSubmitButton().shadow().find('button').click({ force: true });
  cy.wait(5000);
});

// Status page:
Given('a tenant admin user is on status applications page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Status', 4000);
  commonObj.serviceTab('Status', 'Applications').click();
  cy.wait(2000); // Applications page is slow to load applications and healt check info
});

When('the user {string} the subscribe checkbox for health check notification type', function (checkboxOperation) {
  statusObj
    .applicationHealthChangeNotificationSubscribeCheckbox()
    .shadow()
    .find('[class^="container"]')
    .invoke('attr', 'class')
    .then((classAttVal) => {
      if (classAttVal == undefined) {
        expect.fail('Failed to get subscribe checkbox class attribute value.');
      } else {
        switch (checkboxOperation) {
          case 'selects':
            if (classAttVal.includes('selected')) {
              cy.log('The subscribe checkbox was already checked.');
            } else {
              statusObj
                .applicationHealthChangeNotificationSubscribeCheckbox()
                .shadow()
                .find('[class^="container"]')
                .click();
            }
            break;
          case 'unselects':
            if (classAttVal.includes('selected')) {
              statusObj
                .applicationHealthChangeNotificationSubscribeCheckbox()
                .shadow()
                .find('[class^="container"]')
                .click();
            } else {
              cy.log('The subscribe checkbox was already unchecked.');
            }
            break;
          default:
            expect(checkboxOperation).to.be.oneOf(['selects', 'unselects']);
        }
      }
    });
});

Then('the user views the subscribe checkbox is {string}', function (checkboxStatus) {
  cy.wait(2000); // Wait for the checkbox status to show
  statusObj
    .applicationHealthChangeNotificationSubscribeCheckbox()
    .shadow()
    .find('[class^="container"]')
    .invoke('attr', 'class')
    .then((classAttVal) => {
      if (classAttVal == undefined) {
        expect.fail('Failed to get subscribe checkbox class attribute value.');
      } else {
        switch (checkboxStatus) {
          case 'checked':
            expect(classAttVal).to.contain('selected');
            break;
          case 'unchecked':
            expect(classAttVal).to.not.contain('selected');
            break;
          default:
            expect(checkboxStatus).to.be.oneOf(['checked', 'unchecked']);
        }
      }
    });
});

// Notification subscriptions page
Given('a tenant admin user is on notification subscriptions page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Notification', 4000);
  commonObj.serviceTab('Notification', 'Subscriptions').click();
  cy.wait(4000);
});

When('the user types {string} in Search subscriber email field', function (email: string) {
  notificationsObj.searchSubscriberEmail().shadow().find('input').clear().type(email, { delay: 100, force: true });
});

When('the user clicks Search button on notifications page', function () {
  notificationsObj.notificationSearchBtn().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

//notification type in sentence case, only first letter is upper case
Then(
  'the user {string} the subscription of {string}, {string} under {string}',
  function (viewOrNot, addressAs, email, notificationType) {
    switch (viewOrNot) {
      case 'views':
        notificationsObj.notificationRecord(notificationType, addressAs, email).should('exist');
        break;
      case 'should not view':
        notificationsObj.notificationRecord(notificationType, addressAs, email).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

// Status app:

Given('a user is on the public service status page for {string}', function (tenant) {
  const urlToTenantLogin = Cypress.env().statusAppUrl + '/' + tenant;
  cy.visit(urlToTenantLogin);
  cy.wait(3000);
});

Then(
  'the user should be able to view {string} as support email in the status app for {string} tenant',
  function (email, tenant) {
    const urlToTenantLogin = Cypress.env().statusAppUrl + '/' + tenant;
    cy.visit(urlToTenantLogin);
    cy.wait(3000);
    commonObj.statusNotificationPageTitle().should('contain', tenant, { matchCase: false });
    commonObj
      .statusNotificationPleaseContact()
      .should('have.attr', 'href')
      .then((href) => {
        expect(href).to.contain(email);
      });
    commonObj
      .statusNotificationSignupDescription()
      .should('have.attr', 'href')
      .then((href) => {
        expect(href).to.contain(email);
      });
  }
);

Then('the user views the timestamp of {string} being updated', function (appName) {
  commonObj
    .applicationStatusUpdatedTimestamp(appName)
    .invoke('text')
    .then((text) => {
      expect(text).to.contain('Today');
      expect(text).to.match(/[0-9]{1,2}:[0-9]{2} [A|P]M/);
    });
});

Then('the user views the status of {string} being the first unused status', function (appName: string) {
  commonObj
    .applicationStatus(appName.trim())
    .invoke('text')
    .then((text) => {
      cy.task('getNewAppStatus').then((appStatus) => {
        expect(text.toLowerCase().replace(' ', '-')).to.equal(appStatus);
      });
    });
});

Then(
  'the user {string} {string} application in the status app for {string} tenant',
  function (viewOrNot, appName: string, tenantName) {
    const urlToTenantLogin = Cypress.env().statusAppUrl + '/' + tenantName;
    cy.visit(urlToTenantLogin);
    cy.wait(3000);
    let isFound = false;
    commonObj
      .applicationNames()
      .then((name) => {
        for (let i = 0; i < name.length; i++) {
          if (name[i].outerHTML.includes(appName)) {
            isFound = true;
          }
        }
      })
      .then(() => {
        switch (viewOrNot) {
          case 'views':
            expect(isFound).to.eq(true);
            break;
          case 'should not view':
            expect(isFound).to.eq(false);
            break;
          default:
            expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
        }
      });
  }
);
