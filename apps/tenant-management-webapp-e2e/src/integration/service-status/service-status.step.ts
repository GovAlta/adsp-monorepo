import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import ServiceStatusPage from './service-status.page';

const commonObj = new common();
const statusObj = new ServiceStatusPage();

Given('a tenant admin user is on status overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Status', 4000);
});

Then('the user views the health check guidelines', function () {
  statusObj.statusTitle().invoke('text').should('contain', 'Status service');
  statusObj.guidelinesTitle().then((guidelinesTitle) => {
    expect(guidelinesTitle.length).to.be.gt(0);
  });
});

Given('a tenant admin user is on status notices page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Status', 4000);
  commonObj.serviceTab('Status', 'Notices').click();
  cy.wait(4000);
});

When('the user clicks Add notice button', function () {
  statusObj.addNoticeButton().shadow().find('button').click({ force: true });
});

Then('the user views Add notice dialog', function () {
  statusObj.noticeModalTitle().invoke('text').should('eq', 'Add notice');
});

//Date time picker UI isn't finalized and the step uses the default dates without entering any date data
When(
  'the user enters {string}, {string}, {string}, {string}, {string}, {string} on notice dialog',
  function (desc: string, app, startDate, startTime: string, endDate, endTime: string) {
    cy.viewport(1920, 1080);
    statusObj.noticeModalDescField().shadow().find('textarea').clear({ force: true }).type(desc, { force: true });
    // Select Application
    if (app == 'All') {
      statusObj.noticeModalAllApplicationsCheckbox().shadow().find('[class^="container"]').click();
    } else {
      // Uncheck All applications checkbox if checked
      statusObj
        .noticeModalAllApplicationsCheckbox()
        .shadow()
        .find('[class^="container"]')
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (classAttr?.includes('selected')) {
            statusObj.noticeModalAllApplicationsCheckbox().shadow().find('[class^="container"]').click();
          }
        });
      statusObj.noticeModalApplicationDropdown().shadow().find('goa-popover').find('input').click({ force: true });
      statusObj
        .noticeModalApplicationDropdown()
        .shadow()
        .find('goa-popover')
        .find('li[id="' + app + '"]')
        .click({ force: true });
    }
    // Get hour, minute and am/pm for start time and end time
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
      statusObj
        .noticeModalStartTimeField()
        .shadow()
        .find('input')
        .type((Number(startHr) + 12).toString() + ':' + startMin);
    } else {
      statusObj
        .noticeModalStartTimeField()
        .shadow()
        .find('input')
        .type(startHr + ':' + startMin);
    }
    // Enter end time
    if (endAmPm.toLowerCase() == 'pm' && endHr != '12') {
      statusObj
        .noticeModalEndTimeField()
        .shadow()
        .find('input')
        .type((Number(endHr) + 12).toString() + ':' + endMin);
    } else {
      statusObj
        .noticeModalEndTimeField()
        .shadow()
        .find('input')
        .type(endHr + ':' + endMin);
    }
  }
);

When('the user clicks Save as draft button', function () {
  statusObj.noticeModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

When('the user clicks Cancel button in notice modal', function () {
  statusObj.noticeModalCancelButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

// Date time picker UI isn't finalized and dates are today only for now
Then(
  'the user {string} the {string} notice of {string}, {string}, {string}, {string}, {string}, {string}',
  function (viewOrNot, mode, desc, app, startDate: string, startTime, endDate: string, endTime) {
    let startDateTime;
    let endDateTime;
    if (startDate == 'Today' && endDate == 'Today') {
      const currentTime = new Date();
      const todayDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(startDate).to.equal('Today');
      expect(endDate).to.equal('Today');
      startDateTime = todayDate + ' at ' + startTime;
      endDateTime = todayDate + ' at ' + endTime;
    } else {
      const startLongDate = new Date(startDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const endLongDate = new Date(endDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      startDateTime = startLongDate + ' at ' + startTime;
      endDateTime = endLongDate + ' at ' + endTime;
    }
    searchNoticeCards(mode, desc, app, startDateTime, endDateTime).then((index) => {
      if (viewOrNot == 'views') {
        //    expect(index).to.be.greaterThan(0);
      } else if (viewOrNot == 'should not view') {
        //  expect(index).to.equal(0);
      } else {
        //  expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
      }
    });
  }
);

When(
  'the user clicks {string} menu for the {string} notice of {string}, {string}, {string}, {string}, {string}, {string}',
  function (menu: string, mode, desc, app, startDate: string, startTime, endDate: string, endTime) {
    cy.viewport(1920, 1080);
    cy.wait(2000); // Wait for the page to be loaded and stable before operating on menu items
    let startDateTime;
    let endDateTime;
    if (startDate == 'Today' && endDate == 'Today') {
      const currentTime = new Date();
      const todayDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      //expect(startDate).to.equal('Today');
      // expect(endDate).to.equal('Today');
      startDateTime = todayDate + ' at ' + startTime;
      endDateTime = todayDate + ' at ' + endTime;
    } else {
      const startLongDate = new Date(startDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const endLongDate = new Date(endDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      startDateTime = startLongDate + ' at ' + startTime;
      endDateTime = endLongDate + ' at ' + endTime;
    }
    searchNoticeCards(mode, desc, app, startDateTime, endDateTime).then((index) => {
      expect(index).to.not.equal(0);
      cy.wait(2000);
      statusObj
        .noticeCardGearButton(index)
        .scrollIntoView()
        .shadow()
        .find('button')
        .click({ force: true })
        .then(() => {
          switch (menu.toLowerCase()) {
            case 'edit':
              statusObj.noticeCardEditMenu(index).click();
              break;
            case 'delete':
              statusObj.noticeCardDeleteMenu(index).click();
              break;
            case 'publish':
              statusObj.noticeCardPublishMenu(index).click();
              break;
            case 'unpublish':
              statusObj.noticeCardUnpublishMenu(index).click();
              break;
            case 'archive':
              statusObj.noticeCardArchiveMenu(index).click();
              break;
            default:
              expect(menu.toLowerCase()).to.be.oneOf(['edit', 'delete', 'publish', 'unpublish', 'archive']);
          }
          cy.wait(1000);
        });
    });
  }
);

Then('the user views Edit notice dialog', function () {
  statusObj.noticeModalTitle().invoke('text').should('eq', 'Edit notice');
});

When('the user selects {string} filter by status radio button', function (filterType: string) {
  expect(filterType).to.be.oneOf(['Draft', 'Published', 'Archived', 'Active']);
  cy.wait(2000); // To avoid clicking the filter too early
  statusObj
    .filterByStatusRadioGroup()
    .find('goa-radio-item')
    .shadow()
    .find('input[value="' + filterType.toLowerCase() + '"]')
    .click({ force: true });
  cy.wait(2000);
});

Then('the user views {string} notices', function (filterType) {
  // Verify either the grid is empty or all cards have the filtered status
  expect(filterType).to.be.oneOf(['Draft', 'Published', 'Archived', 'Active']);
  statusObj.noticeList().then((elements) => {
    if (elements.length > 1) {
      for (let i = 0; i < elements.length; i++) {
        if (i != 0) {
          // Check mode
          statusObj
            .noticeCardMode(i + 1)
            .shadow()
            .find('.goa-badge-content')
            .invoke('text')
            .then((modeText) => {
              if (filterType != 'Active') {
                expect(modeText).to.equal(filterType);
              } else {
                expect(modeText).to.be.oneOf(['Draft', 'Published']);
              }
            });
        }
      }
    }
  });
});

Then(
  'the user should not view {string} for the {string} notice of {string}, {string}, {string}, {string}, {string}, {string}',
  function (menu, mode, desc, app, startDate: string, startTime, endDate: string, endTime) {
    let startDateTime;
    let endDateTime;
    if (startDate == 'Today' && endDate == 'Today') {
      const currentTime = new Date();
      const todayDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(startDate).to.equal('Today');
      expect(endDate).to.equal('Today');
      startDateTime = todayDate + ' at ' + startTime;
      endDateTime = todayDate + ' at ' + endTime;
    } else {
      const startLongDate = new Date(startDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const endLongDate = new Date(endDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      startDateTime = startLongDate + ' at ' + startTime;
      endDateTime = endLongDate + ' at ' + endTime;
    }
    searchNoticeCards(mode, desc, app, startDateTime, endDateTime).then((index) => {
      expect(index).to.not.equal(0);
      switch (menu) {
        case 'gear icon':
          statusObj.noticeCardGearButton(index).should('not.exist');
          break;
        case 'edit menu':
          statusObj.noticeCardEditMenu(index).should('not.exist');
          break;
        case 'delete menu':
          statusObj.noticeCardDeleteMenu(index).should('not.exist');
          break;
        default:
          expect(menu).to.be.oneOf(['gear icon', 'edit menu', 'delete menu']);
      }
    });
  }
);

//Notice card with mode, description, application, start datetime and end startime
//Input: mode, description, application, start datetime and end startime
//Return: card index number start from 2 (index 1 for filter, index 2 for card 1...) if found; zero if not found
//Note: card index can be used directly in calling menu item, i.e. noticeCardPublishMenu(index)
function searchNoticeCards(mode, desc, app, startDateTime, endDateTime) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let count = 0;
      let cardIndex = 0;
      if (app == 'All') {
        app = 'All applications';
      }
      statusObj
        .noticeList()
        .then((elements) => {
          // Search mode, desc, application and times from the second child element (first child element is the filter)
          cy.log('Total number of notice cards: ' + String(elements.length));
          for (let i = 0; i < elements.length; i++) {
            if (i != 0) {
              // Check mode
              statusObj
                .noticeCardMode(i + 1)
                .shadow()
                .find('.goa-badge-content')
                .invoke('text')
                .then((modeText) => {
                  cy.log('Mode Text: ' + modeText);
                  if (modeText == mode) {
                    // Check description
                    statusObj
                      .noticeCardDesc(i + 1)
                      .invoke('text')
                      .then((descText) => {
                        cy.log('Description: ' + descText);
                        if (descText == desc) {
                          // Check application
                          statusObj
                            .noticeCardApp(i + 1)
                            .invoke('text')
                            .then((appText) => {
                              cy.log('Application: ' + appText);
                              cy.log(app);
                              if (appText == app) {
                                // Check start date and time
                                statusObj
                                  .noticeCardStartDateTime(i + 1)
                                  .invoke('text')
                                  .then((startDateTimeText) => {
                                    cy.log('Start Date and Time: ' + startDateTimeText);
                                    cy.log('Start Date and Time to compare: ' + startDateTime);
                                    if (
                                      startDateTimeText.replace(/\s/g, '').toLowerCase ==
                                      startDateTime.replace(/\s/g, '').toLowerCase
                                    ) {
                                      // Remove white spaces for comparison
                                      // Check end date and time
                                      statusObj
                                        .noticeCardEndDateTime(i + 1)
                                        .invoke('text')
                                        .then((endDateTimeText) => {
                                          cy.log('End Date and Time: ' + endDateTimeText);
                                          if (
                                            endDateTimeText.replace(/\s/g, '').toLowerCase ==
                                            endDateTime.replace(/\s/g, '').toLowerCase
                                          ) {
                                            // Remove white spaces for comparison
                                            count = count + 1;
                                            cardIndex = i + 1;
                                          }
                                        });
                                    }
                                  });
                              }
                            });
                        }
                      });
                  }
                });
            }
          }
        })
        .then(() => {
          resolve(cardIndex);
        });
    } catch (error) {
      reject(error);
    }
  });
}

When('the user clicks Add application button', function () {
  statusObj.addApplicationButton().shadow().find('button').click({ force: true });
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Add application modal', function () {
  statusObj.addEditApplicationModalTitle().invoke('text').should('eq', 'Add application');
});

When(
  'the user enters {string} as name and {string} as description and {string} as endpoint',
  function (name: string, description: string, endpoint: string) {
    statusObj.addEditApplicationNameModalField().shadow().find('input').clear().type(name, { delay: 200, force: true });
    statusObj
      .addEditApplicationDescriptionModalField()
      .shadow()
      .find('textarea')
      .clear()
      .type(description, { force: true });
    statusObj
      .addEditApplicationEndpointModalField()
      .shadow()
      .find('input')
      .clear()
      .type(endpoint, { delay: 50, force: true });
  }
);

Then('the user clicks Save application button', function () {
  statusObj.addEditApplicationSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then('the user clicks Cancel application button', function () {
  statusObj.addEditApplicationCancelBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user {string} {string} in the application list', function (viewOrNot, appName) {
  switch (viewOrNot) {
    case 'views':
      statusObj.applicationCardTitle(appName).should('exist');
      break;
    case 'should not view':
      statusObj.applicationCardTitle(appName).should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

When('the user clicks {string} button for {string}', function (buttonType, appName) {
  switch (buttonType) {
    case 'Edit':
      statusObj.applicationCardEditBtn(appName).shadow().find('button').click({ force: true });
      break;
    case 'Delete':
      statusObj.applicationCardDeleteBtn(appName).shadow().find('button').click({ force: true });
      break;
    default:
      expect(buttonType).to.be.oneOf(['edit', 'delete']);
  }
});

Then(
  'the user views {string} as name and {string} as description in the modal fields',
  function (appName, description) {
    statusObj
      .addEditApplicationNameModalField()
      .invoke('val')
      .then((val) => {
        expect(val).to.eq(appName);
      });
    statusObj
      .addEditApplicationDescriptionModalField()
      .shadow()
      .find('textarea')
      .invoke('val')
      .then((val) => {
        expect(val).to.eq(description);
      });
  }
);

When(
  'the user enters {string} as name and {string} as description fields',
  function (appName: string, description: string) {
    statusObj
      .addEditApplicationNameModalField()
      .shadow()
      .find('input')
      .clear()
      .type(appName, { delay: 100, force: true });
    statusObj
      .addEditApplicationDescriptionModalField()
      .shadow()
      .find('textarea')
      .clear()
      .type(description, { force: true });
  }
);

When('the user clicks Change status button for {string}', function (appName) {
  statusObj.applicationCardChangeStatusBtn(appName).shadow().find('button').click({ force: true });
});

Then('the user views Manual status change modal', function () {
  statusObj.manualStatusChangeModalTitle().invoke('text').should('contain', 'Manual status change');
});

When('the user selects {string} and clicks Save button', function (statusName: string) {
  statusObj
    .manualStatusChangeModalStatusRadioGroup()
    .find('goa-radio-item')
    .shadow()
    .find('input[value="' + statusName.toLowerCase() + '"]')
    .click({ force: true });
  statusObj.manualStatusChangeModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(2000); // Wait for the status to change after save
});

Then('the user views the {string} status for {string}', function (statusValue, appName) {
  statusObj
    .applicationCardStatusBadge(appName)
    .shadow()
    .find('.goa-badge-content')
    .invoke('text')
    .should('eq', statusValue);
});

Then('the user views current status for {string}', function (appName) {
  statusObj
    .applicationCardStatusBadge(appName)
    .shadow()
    .find('.goa-badge-content')
    .invoke('text')
    .then((statusValue) => {
      cy.task('setOriginalAppStatus', statusValue.toLowerCase());
      cy.task('getOriginalAppStatus').then((appStatus) => {
        cy.log('Current Status: ' + appStatus);
      });
    });
});

Then('the user changes status to the first unused status', function () {
  let radioListIndexToCheck;
  const radioList = ['operational', 'maintenance', 'outage', 'reported-issues'];
  // statusObj.manualStatusChangeModalItemList().should('have.length', 4);
  statusObj.manualStatusChangeModalStatusRadioGroup().find('goa-radio-item').should('have.length', 4);
  // statusObj.manualStatusChangeModalItemList().each((item, index) => {
  statusObj
    .manualStatusChangeModalStatusRadioGroup()
    .find('goa-radio-item')
    .each((item, index) => {
      expect(Cypress.$(item).attr('value')).to.eq(radioList[index]);
    });
  statusObj
    .manualStatusChangeModalStatusRadioGroup()
    .invoke('attr', 'value')
    .then(($value) => {
      const checkedStatus = String($value);
      const radioListIndex = radioList.indexOf(checkedStatus);
      if (radioListIndex == 3) {
        radioListIndexToCheck = 0;
      } else {
        radioListIndexToCheck = radioListIndex + 1;
      }
      statusObj
        .manualStatusChangeModalStatusRadioGroup()
        .find('goa-radio-item')
        .shadow()
        .find('input[value="' + radioList[radioListIndexToCheck] + '"]')
        .click({ force: true });
      cy.task('setNewAppStatus', radioList[radioListIndexToCheck]);
      cy.task('getNewAppStatus').then((appStatus) => {
        cy.log('New Status: ' + appStatus);
      });
    });
});

When('the user clicks Save button in Manual status change modal', function () {
  statusObj.manualStatusChangeModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then('the user views the status of {string} changed to the first unused status', function (appName) {
  cy.wait(2000); // Wait for the status to change after save
  statusObj
    .applicationCardStatusBadge(appName)
    .shadow()
    .find('.goa-badge-content')
    .invoke('text')
    .then((statusValue) => {
      cy.log('Badge Status: ' + statusValue);
      const badgeValue = String(statusValue.replace(' ', '-').toLowerCase()); // To handle the difference of reported-issues and reported issues
      cy.task('getNewAppStatus').then((appStatus) => {
        expect(badgeValue).to.equal(appStatus);
      });
      cy.task('getOriginalAppStatus').then((appStatus) => {
        expect(badgeValue).not.to.equal(appStatus);
      });
    });
});

When('the user clicks Edit button for contact information', function () {
  statusObj.contactInformationEditBtn().shadow().find('button').click({ force: true });
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Edit contact information modal on the status overview page', function () {
  statusObj.editContactInformationModal().invoke('text').should('eq', 'Edit contact information');
});

When('the user enters {string} in Edit contact information modal', function (email: string) {
  statusObj
    .editContactInformationEmail()
    .shadow()
    .find('input')
    .clear({ force: true })
    .wait(2000) // Add wait for clear to be effective before proceeding
    .type('{selectAll}', { force: true, parseSpecialCharSequences: true }) //In case clear doesn't work, do select all and then type in text
    .wait(2000)
    .type(email, { delay: 100, force: true });
});

Then('the user clicks Save button on contact information modal', function () {
  statusObj.editContactInformationEmailSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user clicks Cancel button on contact information modal', function () {
  statusObj.editContactInformationEmailCancelBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views {string} as the email of contact information', function (email) {
  statusObj.contactInformationEmailDisplay().invoke('text').should('contain', email);
});

When('the user {string} Monitor only checkbox for {string}', function (checkboxOperation, applicationName) {
  statusObj
    .applicationCardMonitorOnlyCheckbox(applicationName)
    .shadow()
    .find('[class^="container"]')
    .then((checkbox) => {
      switch (checkboxOperation) {
        case 'selects':
          if (!checkbox.attr('class')?.includes('selected')) {
            statusObj
              .applicationCardMonitorOnlyCheckbox(applicationName)
              .shadow()
              .find('[class^="container"]')
              .scrollIntoView()
              .click({ force: true });
          }
          break;
        case 'unselects':
          if (checkbox.attr('class')?.includes('selected')) {
            statusObj
              .applicationCardMonitorOnlyCheckbox(applicationName)
              .shadow()
              .find('[class^="container"]')
              .scrollIntoView()
              .click({ force: true });
          }
          break;
        default:
          expect(checkboxOperation).to.be.oneOf(['selects', 'unselects']);
      }
    });
});

Then('the user {string} {string} in applications dropdown in Add notice model', function (viewOrNot, applicationName) {
  let isFound = false;
  statusObj.noticeModalApplicationDropdownItems().then((dropdownItemElements) => {
    for (let i = 0; i < dropdownItemElements.length; i++) {
      if (dropdownItemElements[i].getAttribute('value') == applicationName) {
        isFound = true;
      }
    }
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
});
