import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import commonlib from '../common/common-library';
import CalendarPage from './calendar.page';
import common from '../common/common.page';

const commonObj = new common();
const calendarObj = new CalendarPage();

Given('a tenant admin user is on calendar service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Calendar', 4000);
});

When('the user clicks Add calendar button on overview tab', function () {
  calendarObj.addCalendarOverviewTabBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks Add calendar button', function () {
  calendarObj.addCalendarBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Add calendar modal', function () {
  calendarObj.addCalendarModalTitle().invoke('text').should('eq', 'Add calendar');
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

When('the user enters {string} in name field in calendar modal', function (name: string) {
  calendarObj.addCalendarModalNameField().shadow().find('input').clear().type(name, { delay: 100, force: true });
});

Then('the user views the error message of {string} on namespace in calendar modal', function (errorMsg) {
  calendarObj
    .addCalendarModalNameFormItem()
    .shadow()
    .find('[class*="error-msg"]')
    .invoke('text')
    .should('contain', errorMsg);
});

When(
  'the user enters {string}, {string}, {string}, {string} in Add calendar modal',
  function (name: string, desc: string, readRole: string, modifyRole: string) {
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
          .find('[class^="container"]')
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
          .find('[class^="container"]')
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
          .find('[class^="container"]')
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
          .find('[class^="container"]')
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
//Return: row number if the calendar is found; zero if the record isn't found
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

When('the user clicks {string} button for the calendar of {string}, {string}', function (button: string, name, desc) {
  findCalendar(name, desc).then((rowNumber) => {
    expect(rowNumber).to.be.greaterThan(0, 'Script of ' + name + ', ' + desc + ' has row #' + rowNumber);
    cy.wait(1000); // Wait for buttons to show up
    switch (button.toLowerCase()) {
      case 'edit':
        calendarObj.calendarEditButton(rowNumber).shadow().find('button').click({ force: true });
        break;
      case 'delete':
        calendarObj.calendarDeleteButton(rowNumber).shadow().find('button').click({ force: true });
        cy.wait(4000);
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
  function (description: string, readRole: string, modifyRole: string) {
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
        .find('[class^="container"]')
        .then((elements) => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute('class')?.includes('selected')) {
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
          .find('[class^="container"]')
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
          .find('[class^="container"]')
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
          .find('[class^="container"]')
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
          .find('[class^="container"]')
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

When('the user selects {string} in Select a calendar on Events page', function (calendarName: string) {
  calendarObj.eventsSelectACalendarDropdown().shadow().find('input').click({ force: true });
  calendarObj.eventsSelectACalendarDropdown().shadow().find('li').contains(calendarName).click({ force: true });
  cy.wait(2000);
});

When('the user clicks Add Event button on events page', function () {
  calendarObj.eventsAddEventButton().shadow().find('button').click({ force: true });
});

Then('the user views Add calendar event modal', function () {
  calendarObj.eventsCalendarEventModalHeading().invoke('text').should('eq', 'Add calendar event');
});

Then('the user views Edit calendar event modal', function () {
  calendarObj.eventsCalendarEventModalHeading().invoke('text').should('eq', 'Edit calendar event');
});

When('the user enters {string} in name field in Add calendar event modal', function (name: string) {
  calendarObj
    .eventsCalendarEventModalNameTextField()
    .shadow()
    .find('input')
    .clear()
    .type(name, { force: true, delay: 200 });
});

Then('the user views the error message of {string} on name in Add calendar event modal', function (errorMsg) {
  calendarObj
    .eventsCalendarEventModalNameFormItem()
    .shadow()
    .find('.error-msg')
    .invoke('text')
    .should('contain', errorMsg);
});

When(
  'the user enters {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string} in calendar event modal',
  function (
    name: string,
    desc: string,
    isPublic: string,
    isAllDay: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ) {
    calendarObj
      .eventsCalendarEventModalNameTextField()
      .shadow()
      .find('input')
      .clear()
      .type(name, { force: true, delay: 200 });
    calendarObj.eventsCalendarEventModalDescription().shadow().find('textarea').clear().type(desc, { force: true });
    // Is all day checkbox
    switch (isAllDay.toLowerCase()) {
      case 'yes':
        calendarObj
          .eventsCalendarEventModalIsAllDayCheckbox()
          .shadow()
          .find('[class^="container"]')
          .invoke('attr', 'class')
          .then((classAttr) => {
            if (!classAttr?.includes('selected')) {
              calendarObj
                .eventsCalendarEventModalIsAllDayCheckbox()
                .shadow()
                .find('[class^="container"]')
                .click({ force: true });
            } else {
              cy.log('Is all day checkbox is already checked off. ');
            }
          });
        break;
      case 'no':
        calendarObj
          .eventsCalendarEventModalIsAllDayCheckbox()
          .shadow()
          .find('[class^="container"]')
          .invoke('attr', 'class')
          .then((classAttr) => {
            if (classAttr?.includes('selected')) {
              calendarObj
                .eventsCalendarEventModalIsAllDayCheckbox()
                .shadow()
                .find('[class^="container"]')
                .click({ force: true });
            } else {
              cy.log('Is all day checkbox is already unchecked. ');
            }
          });
        break;
      default:
        expect(isPublic).to.be.oneOf(['yes', 'no']);
    }
    // Enter start date and end date
    if (startDate == 'Today') {
      const todayDate = new Date().toISOString().slice(0, 10);
      startDate = todayDate;
    }
    calendarObj.eventsCalendarEventModalStartDateField().shadow().find('input').type(startDate);
    if (endDate == 'Today') {
      const todayDate = new Date().toISOString().slice(0, 10);
      endDate = todayDate;
    }
    calendarObj.eventsCalendarEventModalEndDateField().shadow().find('input').type(endDate);
    // Enter start time and end time
    if (isAllDay.toLowerCase() == 'no') {
      // expect(startDate.toLowerCase()).to.eq('today');
      // expect(endDate.toLowerCase()).to.eq('today');
      const startHr = startTime.substring(0, 2);
      const startMin = startTime.substring(3, 5);
      const startAmPm = startTime.substring(6, 8);
      cy.log(startHr, startMin, startAmPm);
      const endHr = endTime.substring(0, 2);
      const endMin = endTime.substring(3, 5);
      const endAmPm = endTime.substring(6, 8);
      cy.log(endHr, endMin, endAmPm);
      // Enter start time
      if (startAmPm.toLowerCase() == 'pm' && startHr != '12') {
        calendarObj
          .eventsCalendarEventModalStartTimeField()
          .shadow()
          .find('input')
          .type((Number(startHr) + 12).toString() + ':' + startMin + ':00');
      } else {
        calendarObj
          .eventsCalendarEventModalStartTimeField()
          .shadow()
          .find('input')
          .type(startHr + ':' + startMin + ':00');
      }
      // Enter end time
      if (endAmPm.toLowerCase() == 'pm' && endHr != '12') {
        calendarObj
          .eventsCalendarEventModalEndTimeField()
          .shadow()
          .find('input')
          .type((Number(endHr) + 12).toString() + ':' + endMin + ':00');
      } else {
        calendarObj
          .eventsCalendarEventModalEndTimeField()
          .shadow()
          .find('input')
          .type(endHr + ':' + endMin + ':00');
      }
      // Is public checkbox
      switch (isPublic.toLowerCase()) {
        case 'yes':
          calendarObj
            .eventsCalendarEventModalIsPublicCheckbox()
            .shadow()
            .find('[class^="container"]')
            .invoke('attr', 'class')
            .then((classAttr) => {
              if (!classAttr?.includes('selected')) {
                calendarObj
                  .eventsCalendarEventModalIsPublicCheckbox()
                  .shadow()
                  .find('[class^="container"]')
                  .click({ force: true });
              } else {
                cy.log('Is Public checkbox is already checked off. ');
              }
            });
          break;
        case 'no':
          calendarObj
            .eventsCalendarEventModalIsPublicCheckbox()
            .shadow()
            .find('[class^="container"]')
            .invoke('attr', 'class')
            .then((classAttr) => {
              if (classAttr?.includes('selected')) {
                calendarObj
                  .eventsCalendarEventModalIsPublicCheckbox()
                  .shadow()
                  .find('[class^="container"]')
                  .click({ force: true });
              } else {
                cy.log('Is Public checkbox is already unchecked. ');
              }
            });
          break;
        default:
          expect(isPublic).to.be.oneOf(['yes', 'no']);
      }
    }
  }
);

When('the user clicks Save button in calendar event modal', function () {
  calendarObj.eventsCalendarEventModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

When('the user clicks Cancel button in calendar event modal', function () {
  calendarObj.eventsCalendarEventModalCancelButton().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then(
  'the user {string} the event of {string}, {string}, {string}',
  function (viewOrNot, name, startDateTime: string, endDateTime: string) {
    const todayDate = new Date().toISOString().slice(0, 10);
    const startDateTimeWithoutToday = startDateTime.replace('Today', todayDate);
    const endDateTimeWithoutToday = endDateTime.replace('Today', todayDate);
    switch (viewOrNot) {
      case 'views':
        findEvent(name, startDateTimeWithoutToday, endDateTimeWithoutToday).then((rowNumber) => {
          expect(rowNumber).to.be.greaterThan(
            0,
            'Event of ' +
              name +
              ', ' +
              startDateTimeWithoutToday +
              ', ' +
              endDateTimeWithoutToday +
              ' has row #' +
              rowNumber
          );
        });
        break;
      case 'should not view':
        calendarObj.eventsTab().then((eventTab) => {
          if (eventTab.find('tbody').length == 0) {
            cy.log('No calendar event in the grid. ');
          } else {
            findEvent(name, startDateTimeWithoutToday, endDateTimeWithoutToday).then((rowNumber) => {
              expect(rowNumber).to.equal(
                0,
                'Event of ' +
                  name +
                  ', ' +
                  startDateTimeWithoutToday +
                  ', ' +
                  endDateTimeWithoutToday +
                  ' has row #' +
                  rowNumber
              );
            });
          }
        });
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

//Find an event with name, start date and time, end date and time
//Input: calendar name, start date and time, end date and time
//Return: row number if the event is found; zero if the record isn't found
function findEvent(eventName, startDateTime, endDateTime) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const targetedNumber = 3; // name, start date and time, end date and time
      calendarObj
        .eventsTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the name cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(eventName)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[1].innerHTML); // Print out the start date and time cell innerHTML for debug purpose
            if (rowElement.cells[1].innerHTML.includes(startDateTime)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[2].innerHTML); // Print out the end date and time cell innerHTML for debug purpose
            if (rowElement.cells[2].innerHTML.includes(endDateTime)) {
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

When(
  'the user clicks {string} icon of {string}, {string}, {string}',
  function (iconName, name, startDateTime: string, endDateTime: string) {
    const todayDate = new Date().toISOString().slice(0, 10);
    const startDateTimeWithoutToday = startDateTime.replace('Today', todayDate);
    const endDateTimeWithoutToday = endDateTime.replace('Today', todayDate);
    findEvent(name, startDateTimeWithoutToday, endDateTimeWithoutToday).then((rowNumber) => {
      switch (iconName) {
        case 'edit':
          calendarObj.eventEditButton(rowNumber).shadow().find('button').click({ force: true });
          break;
        case 'delete':
          calendarObj.eventDeleteButton(rowNumber).shadow().find('button').click({ force: true });
          break;
        default:
          expect(iconName).to.be.oneOf(['edit', 'delete']);
      }
    });
  }
);

Then('the user views the error message of {string} on dates in Add calendar event modal', function (errorMsg) {
  calendarObj
    .eventsCalendarEventModalEndDateFormItem()
    .shadow()
    .find('.error-msg')
    .invoke('text')
    .should('contain', errorMsg);
});

Given('a tenant admin user is on Calendar service Calendars page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Calendar', 4000);
  commonObj.serviceTab('Calendar', 'Calendars').click();
  cy.wait(2000);
});

Then('the user views {string} core calendar under Core cenlendars', function (calendarName: string) {
  calendarObj.coreCalendarsRecordWithNameOnly(calendarName).should('exist');
});

Then('the user views only view details action for core calendar records on Calendars page', function () {
  calendarObj
    .coreCalendarsRecordActions()
    .find('goa-icon-button')
    .should('have.length', 1)
    .and('have.attr', 'icon', 'eye');
});

When('the user clicks eye icon for {string} core calendar', function (name) {
  calendarObj.coreCalendarsRecordWithNameOnlyEyeIcon(name).shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views the calendar details modal for {string}', function (name) {
  calendarObj.viewCalendarDetailsModal().should('exist');
  calendarObj.viewCalendarDetailsModal().find('[slot="heading"]').invoke('text').should('eq', 'View calendar details');
  calendarObj.viewCalendarDetailsModalNameField().invoke('attr', 'value').should('eq', name);
});

Then('the user views {string} tenant roles for read and modify in calendar details modal', function (tenantName) {
  calendarObj
    .viewCalendarDetailsModalRolesTableHeader(tenantName)
    .find('[id^="Calendar-roles"]')
    .invoke('text')
    .should('eq', 'Roles');
  calendarObj
    .viewCalendarDetailsModalRolesTableHeader(tenantName)
    .find('[id^="read-role"]')
    .invoke('text')
    .should('contain', 'Read');
  calendarObj
    .viewCalendarDetailsModalRolesTableHeader(tenantName)
    .find('[id^="modify-role"]')
    .invoke('text')
    .should('contain', 'Modify');
  calendarObj.viewCalendarDetailsModalRoles(tenantName).then((roles) => {
    expect(roles.length).to.be.greaterThan(
      0,
      'There are no roles for tenant ' + tenantName + ' in calendar details modal'
    );
    roles.toArray().forEach((role) => {
      cy.wrap(role).find('td').should('have.length', 3); // Each role should have 3 columns
    });
  });
});

Then('the user views {string} client roles for read and modify in calendar details modal', function (clientName) {
  calendarObj
    .viewCalendarDetailsModalRolesTableHeader(clientName)
    .find('[id^="Calendar-roles"]')
    .invoke('text')
    .should('eq', 'Roles');
  calendarObj
    .viewCalendarDetailsModalRolesTableHeader(clientName)
    .find('[id^="read-role"]')
    .invoke('text')
    .should('contain', 'Read');
  calendarObj
    .viewCalendarDetailsModalRolesTableHeader(clientName)
    .find('[id^="modify-role"]')
    .invoke('text')
    .should('contain', 'Modify');
  calendarObj.viewCalendarDetailsModalRoles(clientName).then((roles) => {
    expect(roles.length).to.be.greaterThan(0, 'There are no roles for ' + clientName + ' in calendar details modal');
    roles.toArray().forEach((role) => {
      cy.wrap(role).find('td').should('have.length', 3); // Each role should have 3 columns
    });
  });
});

When('the user clicks Close button in View calendar details modal', function () {
  calendarObj.viewCalendarDetailsModalCloseBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views View calendar details modal is closed', function () {
  calendarObj.viewCalendarDetailsModal().should('not.exist');
});
