import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import events from './events.page';
import commonlib from '../common/common-library';
import common from '../common/common.page';

const eventsObj = new events();
const commonObj = new common();

Then('the user views events overview page', function () {
  eventsObj.eventsOverviewh3Title().invoke('text').should('contain', 'Event definitions');
});

Then('the user views an event definition of {string} under {string}', function (eventName, eventNamespace) {
  eventsObj.event(eventNamespace, eventName).should('exist');
});

Then(
  'the user {string} an event definition of {string} and {string} under {string}',
  function (viewOrNot, eventName, eventDesc, eventNamespace) {
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
  'the user clicks {string} details button for the definition of {string} under {string}',
  function (showHide, eventName, eventNamespace) {
    switch (showHide) {
      case 'show':
        eventsObj.showDetailsIcon(eventNamespace, eventName).click();
        break;
      case 'hide':
        eventsObj.hideDetailsIcon(eventNamespace, eventName).click();
        break;
      default:
        expect(showHide).to.be.oneOf(['show', 'hide']);
    }
  }
);

Then(
  'the user {string} the definition details of {string} under {string}',
  function (viewOrNot, eventName, eventNamespace) {
    switch (viewOrNot) {
      case 'views':
        eventsObj.eventDetails(eventNamespace, eventName).should('exist');
        break;
      case 'should not view':
        eventsObj.eventDetails(eventNamespace, eventName).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

When('the user clicks Add definition button', function () {
  eventsObj.addDefinitionButton().click();
});

Then('the user views Add definition dialog', function () {
  eventsObj.definitionModalTitle().invoke('text').should('eq', 'Add definition');
});

Then('the user views Edit definition dialog', function () {
  eventsObj.definitionModalTitle().invoke('text').should('eq', 'Edit definition');
});

When(
  'the user enters {string} in Namespace, {string} in Name, {string} in Description',
  function (namespace, name, desc) {
    eventsObj.definitionModalNamespaceField().type(namespace);
    eventsObj.definitionModalNameField().type(name);
    eventsObj.definitionModalDescriptionField().type(desc);
  }
);

When('the user clicks Save button on Definition modal', function () {
  eventsObj.definitionModalSaveButton().click();
  cy.wait(2000);
});

Then('the user views disabled Save button on Definition modal', function () {
  eventsObj.definitionModalSaveButton().should('be.disabled');
});

When(
  'the user clicks {string} button for the definition of {string} and {string} under {string}',
  function (button, eventName, eventDesc, eventNamespace) {
    switch (button) {
      case 'Edit':
        eventsObj.editDefinitionButton(eventNamespace, eventName, eventDesc).click();
        break;
      case 'Delete':
        eventsObj.deleteDefinitionButton(eventNamespace, eventName, eventDesc).click();
        break;
      default:
        expect(button).to.be.oneOf(['Edit', 'Delete']);
    }
  }
);

When('the user enters {string} in Description', function (desc) {
  eventsObj.definitionModalDescriptionField().clear().type(desc);
});

Given('a service owner user is on event definitions page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonObj.adminMenuItem('menu-event').click();
  eventsObj.eventsOverviewh3Title().invoke('text').should('contain', 'Event definitions');
  commonObj.serviceTab('Event', 'Definitions').click();
  cy.wait(2000);
});

Then('the user views the {string} for {string}', function (errorMsg, errorField) {
  switch (errorField) {
    case 'Namespace':
      eventsObj.definitionModalNamespaceFieldErrorMsg().invoke('text').should('eq', errorMsg);
      break;
    case 'Name':
      eventsObj.definitionModalNameFieldErrorMsg().invoke('text').should('eq', errorMsg);
      break;
    default:
      expect(errorField).to.be.oneOf(['Namespace', 'Name']);
  }
});

When('the user clicks Cancel button on Definition modal', function () {
  eventsObj.definitionModalCancelButton().click();
  cy.wait(1000);
});

Then('the user exits the add definition dialog', function () {
  eventsObj.definitionModal().should('not.exist');
});

Then('the user only views show button for event definitions of {string}', function (servicesString) {
  const services = servicesString.split(',');
  for (let i = 0; i < services.length; i++) {
    cy.log(services[i].trim());
    // Verify each event definition of
    eventsObj.eventNames(services[i].trim()).each((element) => {
      cy.log(String(element.text()));
      eventsObj.editDefinitionButtonWithNamespaceAndName(services[i].trim(), element.text()).should('not.exist');
      eventsObj.deleteDefinitionButtonWithNamespaceAndName(services[i].trim(), element.text()).should('not.exist');
      eventsObj.showDetailsIcon(services[i].trim(), element.text()).should('exist');
    });
  }
});

Then('the user views Core streams section', function () {
  eventsObj.coreStreamsSectionTitle().should('exist');
});

When('the user clicks eye icon of {string}', function (streamName) {
  eventsObj.streamToggleButton(streamName).click();
});

Then('the user views the details of {string}', function (streamName) {
  eventsObj
    .streamDetails(streamName)
    .invoke('text')
    .should('contain', '"name": "' + streamName + '"');
});
