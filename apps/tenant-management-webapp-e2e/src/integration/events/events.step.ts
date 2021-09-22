import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import events from './events.page';

const eventsObj = new events();

Then('the user views events overview page', function () {
  eventsObj.eventsOverviewh3Title().invoke('text').should('contain', 'Event Definitions');
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

When('the user clicks Add Definition button', function () {
  eventsObj.addDefinitionButton().click();
});

Then('the user views Add Definition dialog', function () {
  eventsObj.definitionModalTitle().invoke('text').should('eq', 'Add Definition');
});

Then('the user views Edit Definition dialog', function () {
  eventsObj.definitionModalTitle().invoke('text').should('eq', 'Edit Definition');
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
  cy.wait(1000);
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

Then('the user views Delete Definition dialog for the definition of {string}', function (name) {
  eventsObj.deleteDefinitionModalTitle().invoke('text').should('eq', 'Delete Definition');
  eventsObj.deleteDefinitionModalContent().invoke('text').should('contain', name);
});

Then('the user clicks Confirm button', function () {
  eventsObj.deleteDefinitionConfirmButton().click();
});

