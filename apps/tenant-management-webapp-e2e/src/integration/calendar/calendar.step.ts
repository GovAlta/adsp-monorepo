import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import CalendarPage from './calendar.page';

const calendarObj = new CalendarPage();

Given('a tenant admin user is on script service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Script', 4000);
});

Then('the user clicks Add calendar button on overview tab', function () {
  calendarObj.addCalendarOverviewTabBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks Add calendar button', function () {
  calendarObj.addCalendarBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Add calendar modal', function () {
  calendarObj.addScriptModalTitle().invoke('text').should('eq', 'Add calendar');
});

When('the user clicks Save button in Add calendar modal', function () {
  calendarObj.calendarModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

When('the user clicks Cancel button in Add calendar modal', function () {
  calendarObj.calendarModalCancelButton().shadow().find('button').click({ force: true });
});

Then('the user views Calendar tab table header on calendars page', function () {
  calendarObj.calendarTableHeader().should('be.visible');
});

When('the user enters {string} in name field in calendar modal', function (name) {
  calendarObj.addCalendarModalNameField().shadow().find('input').clear().type(name, { delay: 100, force: true });
});

Then('the user views the error message of {string} on namespace in calendar modal', function (errorMsg) {
  calendarObj
    .addCalendarModalNameFormItem()
    .shadow()
    .find('[class="error-msg"]')
    .invoke('text')
    .should('contain', errorMsg);
});

When(
  'the user enters {string}, {string}, {string}, {string} in Add calendar modal',
  function (name, desc, readRole, modifyRole) {
    cy.viewport(1920, 1080);
    calendarObj.addCalendarModalNameField().shadow().find('input').clear().type(name, { delay: 100, force: true });
    calendarObj.addCalendarModalDescriptionField().shadow().find('textarea').clear().type(desc, { force: true });
    // Select read roles or client roles
    const readRoles = readRole.split(',');
    for (let i = 0; i < readRoles.length; i++) {
      if (readRoles[i].includes(':')) {
        const clientReadRoleStringArray = readRoles[i].split(':');
        let clientName = '';
        for (let j = 0; j < clientReadRoleStringArray.length - 1; j++) {
          if (j !== clientReadRoleStringArray.length - 2) {
            clientName = clientName + clientReadRoleStringArray[j].trim() + ':';
          } else {
            clientName = clientName + clientReadRoleStringArray[j];
          }
        }
        const roleName = clientReadRoleStringArray[clientReadRoleStringArray.length - 1];
        calendarObj
          .addCalendarModalClientRolesTable(clientName)
          .find('.role-name')
          .contains(roleName)
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      } else {
        calendarObj
          .addCalendarModalRolesTable()
          .find('.role-name')
          .contains(readRoles[i].trim())
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      }
    }

    // Select modify roles or client roles
    const modifyRoles = modifyRole.split(',');
    for (let i = 0; i < modifyRoles.length; i++) {
      if (modifyRoles[i].includes(':')) {
        const clientModifyRoleStringArray = modifyRoles[i].split(':');
        let clientName = '';
        for (let j = 0; j < clientModifyRoleStringArray.length - 1; j++) {
          if (j !== clientModifyRoleStringArray.length - 2) {
            clientName = clientName + clientModifyRoleStringArray[j].trim() + ':';
          } else {
            clientName = clientName + clientModifyRoleStringArray[j];
          }
        }
        const roleName = clientModifyRoleStringArray[clientModifyRoleStringArray.length - 1];
        calendarObj
          .addCalendarModalClientRolesTable(clientName)
          .find('.role-name')
          .contains(roleName)
          .next()
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      } else {
        calendarObj
          .addCalendarModalRolesTable()
          .find('.role-name')
          .contains(modifyRoles[i].trim())
          .next()
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      }
    }
  }
);

Then('the user {string} the calendar of {string}, {string}', function (viewOrNot, name, desc) {
  findCalendar(name, desc).then((rowNumber) => {
    switch (viewOrNot) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(0, 'Calendar of ' + name + ', ' + desc + ' has row #' + rowNumber);
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Calendar of ' + name + ', ' + desc + ' has row #' + rowNumber);
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  });
});

//Find a calendar with name, description
//Input: calendar name, calendar descriptionin a string separated with comma
//Return: row number if the calendar is found; zero if the script isn't found
function findCalendar(name, desc) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const targetedNumber = 2; // Name and description need to match to find the record
      calendarObj
        .calendarTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the name cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(name)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[2].innerHTML); // Print out the description cell innerHTML for debug purpose
            if (rowElement.cells[2].innerHTML.includes(desc)) {
              counter = counter + 1;
            }
            Cypress.log({
              name: 'Number of matched items for row# ' + rowElement.rowIndex + ': ',
              message: String(String(counter)),
            });
            if (counter == targetedNumber) {
              rowNumber = rowElement.rowIndex;
            }
          });
          Cypress.log({
            name: 'Row number for the found script: ',
            message: String(rowNumber),
          });
          resolve(rowNumber);
        });
    } catch (error) {
      reject(error);
    }
  });
}

When('the user clicks {string} button for the calendar of {string}, {string}', function (button, name, desc) {
  findCalendar(name, desc).then((rowNumber) => {
    expect(rowNumber).to.be.greaterThan(0, 'Script of ' + name + ', ' + desc + ' has row #' + rowNumber);
    cy.wait(1000); // Wait for buttons to show up
    switch (button.toLowerCase()) {
      case 'edit':
        calendarObj.calendarEditButton(rowNumber).shadow().find('button').click({ force: true });
        break;
      case 'delete':
        calendarObj.calendarDeleteButton(rowNumber).shadow().find('button').click({ force: true });
        break;
      default:
        expect(button).to.be.oneOf(['edit', 'delete']);
    }
  });
});

Then('the user views Edit calendar modal', function () {
  calendarObj.editCalendarModal().should('exist');
});

When(
  'the user enters {string} as description and selects {string}, {string} as roles in Edit calendar modal',
  function (description, readRole, modifyRole) {
    calendarObj
      .editCalendarModalDescriptionField()
      .shadow()
      .find('textarea')
      .clear()
      .type(description, { force: true });

    //Unselect all checkboxes
    //Looks like checkboxes can't handle fast clicking to uncheck multiple checkboxes and seems only the last checked checkboxes are unchecked.
    //Didn't find a way to add a delay between clicks. Use 5 loops to make sure missed checked checkboxes are unchecked.
    for (let j = 0; j < 5; j++) {
      cy.wait(500);
      calendarObj
        .editCalendarModalTable()
        .find('goa-checkbox')
        .shadow()
        .find('.goa-checkbox-container')
        .then((elements) => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute('class')?.includes('--selected')) {
              elements[i].click();
            }
          }
        });
    }

    // Select read roles
    const readRoles = readRole.split(',');
    for (let i = 0; i < readRoles.length; i++) {
      if (readRoles[i].includes(':')) {
        const clientReadRoleStringArray = readRoles[i].split(':');
        let clientName = '';
        for (let j = 0; j < clientReadRoleStringArray.length - 1; j++) {
          if (j !== clientReadRoleStringArray.length - 2) {
            clientName = clientName + clientReadRoleStringArray[j].trim() + ':';
          } else {
            clientName = clientName + clientReadRoleStringArray[j];
          }
        }
        const roleName = clientReadRoleStringArray[clientReadRoleStringArray.length - 1];
        calendarObj
          .addCalendarModalClientRolesTable(clientName)
          .find('.role-name')
          .contains(roleName)
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      } else {
        calendarObj
          .addCalendarModalRolesTable()
          .find('.role-name')
          .contains(readRoles[i].trim())
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      }
    }

    // Select modify roles
    const modifyRoles = modifyRole.split(',');
    for (let i = 0; i < modifyRoles.length; i++) {
      if (modifyRoles[i].includes(':')) {
        const clientModifyRoleStringArray = modifyRoles[i].split(':');
        let clientName = '';
        for (let j = 0; j < clientModifyRoleStringArray.length - 1; j++) {
          if (j !== clientModifyRoleStringArray.length - 2) {
            clientName = clientName + clientModifyRoleStringArray[j].trim() + ':';
          } else {
            clientName = clientName + clientModifyRoleStringArray[j];
          }
        }
        const roleName = clientModifyRoleStringArray[clientModifyRoleStringArray.length - 1];
        calendarObj
          .addCalendarModalClientRolesTable(clientName)

          .find('.role-name')
          .contains(roleName)
          .next()
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      } else {
        calendarObj
          .addCalendarModalRolesTable()
          .find('.role-name')
          .contains(modifyRoles[i].trim())
          .next()
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      }
    }
  }
);

When('the user clicks Save button in Edit calendar modal', function () {
  cy.wait(1000); // Wait for the button to enable
  calendarObj.calendarModalSaveButton().shadow().find('button').scrollIntoView().click({ force: true });
  cy.wait(2000); // Wait for the save operation
});
