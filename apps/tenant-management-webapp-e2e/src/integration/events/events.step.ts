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

When('the user clicks eye icon of {string} under Core streams', function (streamName) {
  eventsObj.streamToggleButton(streamName).click();
});

Then('the user views the details of {string} under Core streams', function (streamName) {
  eventsObj
    .streamDetailsTable(streamName)
    .invoke('text')
    .should('contain', '"name": "' + streamName + '"');
});

Given('a tenant admin user is on event streams page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonObj.adminMenuItem('menu-event').click();
  commonObj.serviceTab('Event', 'Streams').click();
  cy.wait(2000);
});

When('the user clicks Add stream button', function () {
  eventsObj.addStreamBtn().click();
});

Then('the user views Add stream modal', function () {
  eventsObj.streamModalTitle().invoke('text').should('eq', 'Add stream');
});

// When(
//   'the user enters {string}, {string}, selects event {string}, selects role {string}',
//   function (streamName, description, event, role) {
//     const events = event.split(',');
//     const roles = role.split(',');
//     eventsObj.streamModalNameInput().clear().type(streamName, { force: true });
//     eventsObj.streamModalDescriptionInput().clear().type(description, { force: true });
//     eventsObj.streamModalEventDropdown().click({ force: true });

When('the user enters {string}, {string} and events {string}', function (name, description, event) {
  const events = event.split(',');
  eventsObj.streamModalNameInput().scrollIntoView().clear().type(name);
  eventsObj.streamModalDescriptionInput().scrollIntoView().clear().type(description);
  eventsObj.streamModalEventDropdown().click();
  eventsObj
    .streamModalEventDropdownItems()
    .then((elements) => {
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].className.includes('goa-dropdown0-option--selected')) {
          elements[i].click();
        }
      }
    })
    .then(() => {
      for (let i = 0; i < events.length; i++) {
        eventsObj.streamModalEventDropdownItem(events[i].trim()).click({ force: true });
      }
    });
  eventsObj.streamModalEventDropdownBackground().scrollIntoView().click({ force: true }); // To collapse the event dropdown
});

//Role selector, Deselect all previously selected roles and then select new roles

// eventsObj
//   .streamModalRolesCheckbox(role)
//   .scrollIntoView()
//   .then((elements) => {
//     for (let i = 0; i < elements.length; i++) {
//       if (elements[i].className == 'goa-checkbox-container goa-checkbox--selected') {
//         elements[i].click();
//       }
//     }
//   })
//   .then(() => {
//     for (let i = 0; i < events.length; i++) {
//       if (roles[i].includes(':')) {
//         eventsObj.streamModalRolesCheckbox(roles[i].trim()).click({ force: true });
//       } else {
//         eventsObj.streamModalRolesCheckbox(roles[i].trim()).click({ force: true });
//       }
//     }
//   });

Then('the user clicks Save button on Stream modal', function () {
  eventsObj.streamModalSaveButton().scrollIntoView().click({ force: true });
  cy.wait(2000);
});

Then('the user {string} the stream of {string}', function (viewOrNot, streamName) {
  if (viewOrNot == 'views') {
    eventsObj.streamNameList().should('contain', streamName);
  } else if (viewOrNot == 'should not view') {
    eventsObj.streamNameList().should('not.contain', streamName);
  } else {
    expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

//Find stream  with name, Subscriber role(s)
//Input: stream name, role(s) in a string separated with comma
//Return: row number if the stream is found; zero if the stream isn't found
function findStream(streamName, role) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const subscriberRoles = role.split(',');

      const targetedNumber = subscriberRoles.length + 1; // Name, roles need to match to find the stream
      eventsObj
        .streamTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            if (rowElement.cells[0].innerHTML.includes(streamName)) {
              counter = counter + 1;
            }
            subscriberRoles.forEach((sRole) => {
              if (rowElement.cells[1].innerHTML.includes(sRole.trim())) {
                counter = counter + 1;
              }
            });
            Cypress.log({
              name: 'Number of matched items for row# ' + rowElement.rowIndex + ': ',
              message: String(String(counter)),
            });
            if (counter == targetedNumber) {
              rowNumber = rowElement.rowIndex;
            }
          });
          Cypress.log({
            name: 'Row number for the found file type: ',
            message: String(rowNumber),
          });
          resolve(rowNumber);
        });
    } catch (error) {
      reject(error);
    }
  });
}

Then('the user {string} the stream of {string}, {string}', function (viewOrNot, streamName, role) {
  findStream(streamName, role).then((rowNumber) => {
    switch (viewOrNot) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(0, 'Stream of ' + streamName + ', ' + role + ' has row #' + rowNumber);
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Stream of ' + streamName + ', ' + role + ' has row #' + rowNumber);
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  });
});

Then('the user views the stream details of {string}, {string}, {string}', function (streamName, description, event) {
  eventsObj.streamDetails().should('contain', streamName);
  eventsObj.streamDetails().should('contain', description);

  if (event.split(',')[0] == event) {
    eventsObj
      .streamDetails()
      .invoke('text')
      .then((eventDetails) => {
        const namespace = event.split(':')[0].trim();
        const name = event.split(':')[1].trim();
        expect(eventDetails).to.contain('"namespace": ' + '"' + namespace + '"');
        expect(eventDetails).to.contain('"name": ' + '"' + name + '"');
      });
  } else {
    const events = event.split(',');
    for (let i = 0; i < events.length; i++) {
      eventsObj
        .streamDetails()
        .invoke('text')
        .then((eventDetails) => {
          const namespace = events[i].split(':')[0].trim();
          const name = events[i].split(':')[1].trim();
          expect(eventDetails).to.contain('"namespace": ' + '"' + namespace + '"');
          expect(eventDetails).to.contain('"name": ' + '"' + name + '"');
        });
    }
  }
});

When('the user clicks {string} button of {string}', function (button, streamName) {
  switch (button) {
    case 'Eye':
      eventsObj.streamDetailsEyeIcon(streamName).click({ force: true });
      break;
    case 'Edit':
      eventsObj.streamEditBtn(streamName).click({ force: true });
      break;
    case 'Delete':
      eventsObj.streamDeleteBtn(streamName).click({ force: true });
      break;
    default:
      expect(button).to.be.oneOf(['Eye', 'Edit', 'Delete']);
      cy.wait(1000);
  }
});

Then('the user clicks eye-off icon of {string} to close the schema', function (streamName) {
  eventsObj.streamDetailsEyeIconOff(streamName).click();
});

Then('the user views Edit stream modal', function () {
  eventsObj.streamModalTitle().invoke('text').should('eq', 'Edit stream');
});

When('the user enters {string}, {string}, {string}', function (description, event, role) {
  eventsObj.streamModalDescriptionInput().scrollIntoView().clear({ force: true }).type(description, { force: true });
  eventsObj.streamModalEventDropdown().click();
  eventsObj.streamModalEventDropdownItem(event).then(() => {
    for (let i = 0; i < events.length; i++) {
      if (events[i].includes(',')) {
        eventsObj.streamModalEventDropdownItem(events[i].trim()).click({ force: true });
      } else {
        eventsObj.streamModalEventDropdownItem(events[i].trim()).click({ force: true });
      }
    }
  });
  eventsObj.streamModalEventDropdown().click({ force: true });
  const roles = role.split(',');
  eventsObj
    .streamModalRolesCheckbox(role)
    .scrollIntoView()
    .then(() => {
      for (let i = 0; i < events.length; i++) {
        if (roles[i].includes(',')) {
          eventsObj.streamModalRolesCheckbox(roles[i].trim()).click({ force: true });
        } else {
          eventsObj.streamModalRolesCheckbox(roles[i].trim()).click({ force: true });
        }
      }
    });
});
