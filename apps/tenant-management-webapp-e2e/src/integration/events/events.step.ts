import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
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

When(
  'the user clicks {string} details button for the definition of {string} under {string}',
  function (showHide, eventName, eventNamespace) {
    switch (showHide) {
      case 'show':
        eventsObj.showDetailsIcon(eventNamespace, eventName).shadow().find('button').click({ force: true });
        break;
      case 'hide':
        eventsObj.hideDetailsIcon(eventNamespace, eventName).shadow().find('button').click({ force: true });
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

Then('the user views Edit definition dialog', function () {
  eventsObj.definitionModalTitle().invoke('text').should('eq', 'Edit definition');
});

Then('the user views disabled Save button on Definition modal', function () {
  eventsObj.definitionModalSaveButton().shadow().find('button').should('be.disabled');
});

When('the user enters {string} in Description', function (desc: string) {
  eventsObj.definitionModalDescriptionField().shadow().find('textarea').clear().type(desc, { force: true });
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
      eventsObj
        .definitionModalNamespaceFormItem()
        .shadow()
        .find('.error-msg')
        .invoke('text')
        .should('contain', errorMsg);
      break;
    case 'Name':
      eventsObj.definitionModalNameFormItem().shadow().find('.error-msg').invoke('text').should('contain', errorMsg);
      break;
    default:
      expect(errorField).to.be.oneOf(['Namespace', 'Name']);
  }
});

When('the user clicks Cancel button on Definition modal', function () {
  eventsObj.definitionModalCancelButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user exits the add definition dialog', function () {
  eventsObj.definitionModal().should('not.exist');
});

Then('the user only views show button for event definitions of {string}', function (servicesString: string) {
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
  eventsObj.streamToggleButton(streamName).shadow().find('button').click({ force: true });
});

Then('the user views the details of {string} under Core streams', function (streamName) {
  eventsObj
    .streamDetails(streamName)
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
  eventsObj.addStreamBtn().shadow().find('button').click({ force: true });
});

Then('the user views Add stream modal', function () {
  eventsObj.streamModalTitle().invoke('text').should('eq', 'Add stream');
});

//User can use "n/a" as input for event or role in case there is no selection of the event or role
When(
  'the user enters {string}, {string}, {string}, {string} in Add stream modal',
  function (name: string, description: string, event: string, role: string) {
    cy.wait(4000); // Wait stream modal to show content
    const events = event.split(',');
    eventsObj.streamModalNameInput().shadow().find('input').clear().type(name, { delay: 100, force: true });
    eventsObj
      .streamModalDescriptionInput()
      .shadow()
      .find('textarea')
      .scrollIntoView()
      .clear()
      .type(description, { force: true });
    if (event !== 'n/a') {
      eventsObj.streamModalEventDropdown().click();
      eventsObj.streamModalEventDropdownItems().then(() => {
        for (let i = 0; i < events.length; i++) {
          eventsObj.streamModalEventDropdownItem(events[i].trim()).click({ force: true });
        }
      });
      eventsObj.streamModalEventDropdownBackground().click({ force: true }); // To collapse the event dropdown
    }
    //Role(s) selection of roles including public
    if (role == 'public') {
      eventsObj
        .streamModalPublicCheckbox()
        .shadow()
        .find('.goa-checkbox-container')
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (classAttr?.includes('selected')) {
            cy.log('Make stream public checkbox is already checked. ');
          } else {
            eventsObj.streamModalPublicCheckbox().shadow().find('.goa-checkbox-container').click();
          }
        });
    } else if (role == 'n/a') {
      // Do nothing
    } else {
      // Select roles or client roles
      const roles = role.split(',');
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].includes(':')) {
          const clientRoleStringArray = roles[i].split(':');
          let clientName = '';
          for (let j = 0; j < clientRoleStringArray.length - 1; j++) {
            if (j !== clientRoleStringArray.length - 2) {
              clientName = clientName + clientRoleStringArray[j].trim() + ':';
            } else {
              clientName = clientName + clientRoleStringArray[j];
            }
          }
          const roleName = clientRoleStringArray[clientRoleStringArray.length - 1];
          eventsObj
            .streamModalClientRolesTable(clientName)
            .find('.role-name')
            .contains(roleName)
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
        } else {
          eventsObj
            .streamModalRolesTable()
            .find('.role-name')
            .contains(roles[i].trim())
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
        }
      }
    }
  }
);

Then('the user clicks Save button in Stream modal', function () {
  eventsObj.streamModalSaveButton().shadow().find('button').click({ force: true });
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

Then(
  'the user views the stream details of {string}, {string}, {string}, {string}',
  function (streamName, description, event: string, role: string) {
    eventsObj.streamDetails(streamName).should('contain', streamName);
    eventsObj.streamDetails(streamName).should('contain', description);
    if (role == 'public') eventsObj.streamDetails(streamName).should('contain', '"publicSubscribe": true');
    else {
      eventsObj.streamDetails(streamName).should('contain', '"publicSubscribe": false');
    }
    const roles = role.split(',');
    for (let i = 0; i < roles.length; i++) {
      eventsObj
        .streamDetails(streamName)
        .invoke('text')
        .then((roleDetails) => {
          const subscriberRoles = roles[i].trim();
          expect(roleDetails).to.contain(subscriberRoles);
        });
    }
    const events = event.split(',');
    for (let i = 0; i < events.length; i++) {
      eventsObj
        .streamDetails(streamName)
        .invoke('text')
        .then((eventDetails) => {
          const namespace = events[i].split(':')[0].trim();
          const name = events[i].split(':')[1].trim();
          expect(eventDetails).to.contain('"namespace": ' + '"' + namespace + '"');
          expect(eventDetails).to.contain('"name": ' + '"' + name + '"');
        });
    }
  }
);

When('the user clicks {string} button for the stream of {string}', function (button, streamName) {
  switch (button) {
    case 'Eye':
      eventsObj.streamDetailsEyeIcon(streamName).shadow().find('button').click({ force: true });
      break;
    case 'Eye-Off':
      eventsObj.streamDetailsEyeOffIcon(streamName).shadow().find('button').click({ force: true });
      break;
    case 'Edit':
      eventsObj.streamEditBtn(streamName).shadow().find('button').click({ force: true });
      cy.wait(1000); // wait for the edit modal components to be operational
      break;
    case 'Delete':
      eventsObj.streamDeleteBtn(streamName).shadow().find('button').click({ force: true });
      break;
    default:
      expect(button).to.be.oneOf(['Eye', 'Edit', 'Eye-Off', 'Delete']);
  }
});

Then('the user views Edit stream modal', function () {
  eventsObj.streamModalTitle().invoke('text').should('eq', 'Edit stream');
});

//User can use "n/a" as input for event or role in case there is no selection of the event or role
Then(
  'the user enters {string}, {string}, {string} in Edit stream modal',
  function (description: string, event: string, role: string) {
    eventsObj.streamModalDescriptionInput().shadow().find('textarea').clear().type(description, { force: true });
    if (event == 'n/a') {
      eventsObj.streamModalEventDropdown().should('exist');
    } else {
      const events = event.split(',');
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
            eventsObj.streamModalEventDropdownItem(events[i].trim()).click();
          }
        });
    }
    if (role == 'public') {
      eventsObj
        .streamModalPublicCheckbox()
        .shadow()
        .find('.goa-checkbox-container')
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (classAttr?.includes('--selected')) {
            cy.log('Make stream public is already checked off.');
          } else {
            eventsObj.streamModalPublicCheckbox().shadow().find('.goa-checkbox-container').click({ force: true });
          }
        });
    } else if (role == 'n/a') {
      eventsObj.streamModalRolesCheckboxes().should('exist');
    } else {
      eventsObj
        .streamModalPublicCheckbox()
        .shadow()
        .find('.goa-checkbox-container')
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (classAttr?.includes('--selected')) {
            eventsObj.streamModalPublicCheckbox().shadow().find('.goa-checkbox-container').click({ force: true });
          }
        });
      cy.wait(1000);
      // Unselect all roles
      eventsObj
        .streamModalRolesTables()
        .find('goa-checkbox')
        .shadow()
        .find('.goa-checkbox-container')
        .then((elements) => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].className == 'goa-checkbox-container goa-checkbox--selected') {
              elements[i].click();
            }
          }
        });
      // Select roles or client roles
      const roles = role.split(',');
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].includes(':')) {
          const clientRoleStringArray = roles[i].split(':');
          let clientName = '';
          for (let j = 0; j < clientRoleStringArray.length - 1; j++) {
            if (j !== clientRoleStringArray.length - 2) {
              clientName = clientName + clientRoleStringArray[j].trim() + ':';
            } else {
              clientName = clientName + clientRoleStringArray[j];
            }
          }
          const roleName = clientRoleStringArray[clientRoleStringArray.length - 1];
          eventsObj
            .streamModalClientRolesTable(clientName)
            .find('.role-name')
            .contains(roleName)
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
        } else {
          eventsObj
            .streamModalRolesTable()
            .find('.role-name')
            .contains(roles[i].trim())
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
        }
      }
    }
  }
);

When('the user removes event chips of {string} in Edit stream modal', function (event: string) {
  const eventChip = event.split(',');
  for (let i = 0; i < eventChip.length; i++) {
    eventsObj.streamModalEventChips().shadow().get(`[content="${eventChip}"]`).click();
  }
});

When('the user {string} Make stream public checkbox in Stream modal', function (selectOrUnselect) {
  eventsObj
    .streamModalPublicCheckbox()
    .shadow()
    .find('.goa-checkbox-container')
    .invoke('attr', 'class')
    .then((classAttr) => {
      switch (selectOrUnselect) {
        case 'selects':
          if (classAttr?.includes('selected')) {
            cy.log('Make stream public checkbox is already checked. ');
          } else {
            eventsObj
              .streamModalPublicCheckbox()
              .shadow()
              .find('.goa-checkbox-container')
              .scrollIntoView()
              .click({ force: true });
          }
          break;
        case 'un-selects':
          if (classAttr?.includes('selected')) {
            eventsObj
              .streamModalPublicCheckbox()
              .shadow()
              .find('.goa-checkbox-container')
              .scrollIntoView()
              .click({ force: true });
          } else {
            cy.log('Make stream public checkbox is already un-selected. ');
          }
          break;
        default:
          expect(selectOrUnselect).to.be.oneOf(['selects', 'un-selects']);
      }
    });
});
