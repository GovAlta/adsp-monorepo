import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import serviceStatusPage from './service-status.page';

const commonObj = new common();
const statusObj = new serviceStatusPage();

Given('a service owner user is on service status page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Status', 4000);
});

Then('the user views the health check guidelines', function () {
  statusObj.statusTab('Guidelines').click();
  statusObj.guidelinesTitle().then((guidelinesTitle) => {
    expect(guidelinesTitle.length).to.be.gt(0);
  });
});

Given('a service owner user is on status notices page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Status', 4000);
  commonObj.serviceTab('Service status', 'Notices').click();
  cy.wait(10000);
});

When('the user clicks Add notice button', function () {
  statusObj.addNoticeButton().click();
});

Then('the user views Add notice dialog', function () {
  statusObj.noticeModalTitle().invoke('text').should('eq', 'Add notice');
});

//Date time picker UI isn't finalized and the step uses the default dates without entering any date data
When(
  'the user enters {string}, {string}, {string}, {string}, {string}, {string}',
  function (desc, app, startDate, startTime, endDate, endTime) {
    statusObj.noticeModalDescField().clear().type(desc);
    statusObj.noticeModalApplicationDropdown().click();
    statusObj.noticeModalApplicationDropdownItem(app).click();
    // Get hour, minute and am/pm for start time and end time
    const startHr = startTime.substring(0, 2);
    const startMin = startTime.substring(3, 5);
    const startAmPm = startTime.substring(6, 8);
    cy.log(startHr, startMin, startAmPm);
    const endHr = endTime.substring(0, 2);
    const endMin = endTime.substring(3, 5);
    const endAmPm = endTime.substring(6, 8);
    // Enter start time
    if (startHr.substring(0, 1) == '0') {
      statusObj.noticeModalStartTimeHourField().type(startHr.substring(1, 2));
    } else {
      statusObj.noticeModalStartTimeHourField().type(startHr);
    }
    statusObj.noticeModalStartTimeMinuteField().type(startMin);
    statusObj.noticeModalStartTimeAmPmDropdown().select(startAmPm);
    // Enter end time
    if (endHr.substring(0, 1) == '0') {
      statusObj.noticeModalEndTimeHourField().type(endHr.substring(1, 2));
    } else {
      statusObj.noticeModalEndTimeHourField().type(endHr);
    }
    statusObj.noticeModalEndTimeMinuteField().type(endMin);
    statusObj.noticeModalEndTimeAmPmDropdown().select(endAmPm), cy.log(startDate, startTime, endDate, endTime);
  }
);

When('the user clicks Save as draft button', function () {
  statusObj.noticeModalSaveButton().click();
  cy.wait(5000);
});

// Date time picker UI isn't finalized and dates are today only for now
Then(
  'the user {string} the {string} notice of {string}, {string}, {string}, {string}, {string}, {string}',
  function (viewOrNot, mode, desc, app, startDate, startTime, endDate, endTime) {
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
        expect(index).to.be.greaterThan(0);
      } else if (viewOrNot == 'should not view') {
        expect(index).to.equal(0);
      } else {
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
      }
    });
  }
);

When(
  'the user clicks {string} menu for the {string} notice of {string}, {string}, {string}, {string}, {string}, {string}',
  function (menu, mode, desc, app, startDate, startTime, endDate, endTime) {
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
      statusObj
        .noticeCardGearButton(index)
        .click()
        .then(() => {
          switch (menu) {
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
              expect(menu).to.be.oneOf(['edit', 'delete', 'publish', 'unpublish', 'archive']);
          }
          cy.wait(1000);
        });
    });
  }
);

Then('the user views Edit notice dialog', function () {
  statusObj.noticeModalTitle().invoke('text').should('eq', 'Edit notice');
});

When('the user selects {string} filter by status radio button', function (filterType) {
  expect(filterType).to.be.oneOf(['Draft', 'Published', 'Archived', 'All']);
  if (filterType == 'Published') {
    filterType = 'active';
  }
  statusObj.filterByStatusRadio(filterType.toLowerCase()).click();
});

Then('the user views {string} notices', function (filterType) {
  // Verify either the grid is empty or all cards have the filtered status
  expect(filterType).to.be.oneOf(['Draft', 'Published', 'Archived', 'All']);
  statusObj.noticeList().then((elements) => {
    if (elements.length > 1) {
      for (let i = 0; i < elements.length; i++) {
        if (i != 0) {
          // Check mode
          statusObj
            .noticeCardMode(i + 1)
            .invoke('text')
            .then((modeText) => {
              if (filterType != 'All') {
                expect(modeText).to.equal(filterType);
              } else {
                expect(modeText).to.be.oneOf(['Draft', 'Published', 'Archived']);
              }
            });
        }
      }
    }
  });
});

Then(
  'the user {string} the gear icon for the {string} notice of {string}, {string}, {string}, {string}, {string}, {string}',
  function (viewOrNot, mode, desc, app, startDate, startTime, endDate, endTime) {
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
      statusObj.noticeCardGearButton(index).should('not.exist');
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
                                    if (startDateTimeText.replace(/\s/g, '') == startDateTime.replace(/\s/g, '')) {
                                      // Remove white spaces for comparison
                                      // Check end date and time
                                      statusObj
                                        .noticeCardEndDateTime(i + 1)
                                        .invoke('text')
                                        .then((endDateTimeText) => {
                                          cy.log('End Date and Time: ' + endDateTimeText);
                                          if (endDateTimeText.replace(/\s/g, '') == endDateTime.replace(/\s/g, '')) {
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

Given('a tenant admin user is on status applications page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Status', 4000);
  commonObj.serviceTab('Service status', 'Applications').click();
  cy.wait(2000); // Applications page is slow to load applications and healt check info
});

When('the user {string} the subscribe checkbox for health check notification type', function (checkboxOperation) {
  statusObj
    .applicationHealthChangeNotificationSubscribeCheckbox()
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
              statusObj.applicationHealthChangeNotificationSubscribeCheckbox().click();
            }
            break;
          case 'unselects':
            if (classAttVal.includes('selected')) {
              statusObj.applicationHealthChangeNotificationSubscribeCheckbox().click();
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
  cy.wait(1000); // Wait for the checkbox status to show
  statusObj
    .applicationHealthChangeNotificationSubscribeCheckbox()
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
//LD
When('the user clicks Add Application button', function () {
  statusObj.addApplicationButton().click();
});

Then('the user views Add application modal', function () {
  statusObj.addApplicationModalTitle().click();
});

When(
  'the user enters {string} as name and {string} as description and {string} as endpoint',
  function (name, description, endpoint) {
    statusObj.addApplicationNameModalField().type(name);
    statusObj.addApplicationDescriptionModalField().type(description);
    statusObj.addApplicationEndpointModalField().type(endpoint);
  }
);

Then('the user clicks save application button', function () {
  statusObj.addApplicationSaveBtn().click();
  cy.wait(2000);
});

Then('the user views {string} in the application list', function (appName) {
  statusObj.applicationList().contains(appName);
});

Then('simple delete {string}', function (appName) {
  statusObj.applicationList().contains(appName);
  statusObj.applicationListDeleteBtn().click();
});

When('the user clicks {string} button for {string}', function (buttonType, appName) {
  switch (buttonType) {
    case 'edit':
      statusObj.applicationList().contains(appName);
      statusObj.applicationListEditBtn().click();
      break;
    case 'delete':
      statusObj.applicationList().contains(appName);
      statusObj.applicationListDeleteBtn().click({ force: true });
      break;
    default:
      expect(buttonType).to.be.oneOf(['edit', 'delete']);
  }
});

Then('the user views confirmation modal to delete {string}', function (appName) {
  statusObj.applicationDeleteConfirmationModalTitle().contains('Confirmation');
  statusObj.applicationDeleteConfirmationModalContent().contains(appName);
});

Then('the user clicks Yes to Confirm deletion', function () {
  statusObj.applicationDeleteConfirmationModalYesBtn().click({ force: true });
});
