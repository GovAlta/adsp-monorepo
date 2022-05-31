import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import ServiceStatusPage from './service-status.page';
import TenantAdminPage from '../tenant-admin/tenant-admin.page';

const commonObj = new common();
const statusObj = new ServiceStatusPage();
const tenantAdminObj = new TenantAdminPage();
let originalStatus;
let newStatus;

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
  statusObj.statusTitle().invoke('text').should('contain', 'Status service');
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
  commonObj.serviceTab('Status', 'Notices').click();
  cy.wait(4000);
});

When('the user clicks Add notice button', function () {
  statusObj.addNoticeButton().click();
});

Then('the user views Add notice dialog', function () {
  statusObj.noticeModalTitle().invoke('text').should('eq', 'Add notice');
});

//Date time picker UI isn't finalized and the step uses the default dates without entering any date data
When(
  'the user enters {string}, {string}, {string}, {string}, {string}, {string} on notice dialog',
  function (desc, app, startDate, startTime, endDate, endTime) {
    statusObj.noticeModalDescField().clear({ force: true }).type(desc);
    // Select Application
    if (app == 'All') {
      statusObj.noticeModalAllApplicationsCheckbox().click();
    } else {
      // Uncheck All applications checkbox if checked
      statusObj
        .noticeModalAllApplicationsCheckbox()
        .invoke('attr', 'class')
        .then((classAttr) => {
          if (classAttr?.includes('-selected')) {
            statusObj.noticeModalAllApplicationsCheckbox().click();
          }
        });
      statusObj.noticeModalApplicationDropdown().click();
      statusObj.noticeModalApplicationDropdownItem(app).click();
    }
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
  cy.wait(2000);
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
        .scrollIntoView()
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
  expect(filterType).to.be.oneOf(['Draft', 'Published', 'Archived', 'Active']);
  statusObj.filterByStatusRadio(filterType.toLowerCase()).click();
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
  cy.wait(2000); // Wait for the checkbox status to show
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

When('the user clicks Add application button', function () {
  statusObj.addApplicationButton().click();
});

Then('the user views Add application modal', function () {
  statusObj.addApplicationModalTitle().invoke('text').should('eq', 'Add application');
});

When(
  'the user enters {string} as name and {string} as description and {string} as endpoint',
  function (name, description, endpoint) {
    statusObj.addApplicationNameModalField().clear().type(name);
    statusObj.addApplicationDescriptionModalField().clear().type(description);
    statusObj.addApplicationEndpointModalField().clear().type(endpoint);
  }
);

Then('the user clicks Save application button', function () {
  statusObj.addApplicationSaveBtn().click();
  cy.wait(4000);
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
      statusObj.applicationCardEditBtn(appName).click();
      break;
    case 'Delete':
      statusObj.applicationCardDeleteBtn(appName).click();
      break;
    default:
      expect(buttonType).to.be.oneOf(['edit', 'delete']);
  }
});

Then(
  'the user views {string} as name and {string} as description in the modal fields',
  function (appName, description) {
    statusObj
      .addApplicationNameModalField()
      .invoke('val')
      .then((val) => {
        expect(val).to.eq(appName);
      });
    statusObj
      .addApplicationDescriptionModalField()
      .invoke('val')
      .then((val) => {
        expect(val).to.eq(description);
      });
  }
);

When('the user enters {string} as name and {string} as description fields', function (appName, description) {
  statusObj.addApplicationNameModalField().clear().type(appName);
  statusObj.addApplicationDescriptionModalField().clear().type(description);
});

When('the user clicks Change status button for {string}', function (appName) {
  statusObj.applicationCardChangeStatusBtn(appName).click();
});

Then('the user views Manual status change modal', function () {
  statusObj.manualStatusChangeModalTitle().invoke('text').should('contain', 'Manual status change');
});

When('the user selects {string} and clicks Save button', function (statusName) {
  statusObj.manualStatusChangeModalStatusRadio(statusName.toLowerCase()).click();
  statusObj.manualStatusChangeModalSaveBtn().click();
  cy.wait(2000); // Wait for the status to change after save
});

Then('the user views the {string} status for {string}', function (statusValue, appName) {
  statusObj.applicationCardStatusBadge(appName).invoke('text').should('eq', statusValue);
});

Then('the user views current status for {string}', function (appName) {
  statusObj
    .applicationCardStatusBadge(appName)
    .invoke('text')
    .then((statusValue) => {
      originalStatus = statusValue;
      cy.log('Current Status: ' + originalStatus);
    });
});

Then('the user changes status to the first unused status', function () {
  const radioList = ['Operational', 'Maintenance', 'Outage', 'Reported issues'];
  statusObj.manualStatusChangeModalItemList().should('have.length', 4);
  statusObj.manualStatusChangeModalItemList().each((item, index) => {
    expect(Cypress.$(item).text()).to.eq(radioList[index]);
  });
  statusObj
    .manualStatusChangeModalCheckedRadioBtn()
    .invoke('val')
    .then(($value) => {
      const checkedStatus = String($value);
      statusObj.manualStatusChangeModalRadioBtns().each(($item) => {
        if ($item.val() != checkedStatus) {
          $item.trigger('click');
          newStatus = $item.val();
          cy.log('New Status: ' + newStatus);
          return false;
        }
      });
    });
});

When('the user clicks Save button in Manual status change modal', function () {
  statusObj.manualStatusChangeModalSaveBtn().click();
  cy.wait(2000);
});

Then('the user views the status of {string} changed to the first unused status', function (appName) {
  statusObj
    .applicationCardStatusBadge(appName)
    .invoke('text')
    .then((statusValue) => {
      cy.log('Badge Status: ' + statusValue);
      const badgeValue = String(statusValue.toLowerCase());
      expect(badgeValue).to.equal(newStatus);
      expect(badgeValue).not.to.equal(originalStatus.toLowerCase());
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
    } else {
      orgStatusValidationString = originalStatus.toLowerCase();
    }
    if (newStatusInput != '{new status}') {
      newStatusValidationString = newStatusInput;
    } else {
      newStatusValidationString = newStatus.toLowerCase();
    }

    tenantAdminObj.eventToggleDetailsIcons().each(($element, $index, $full_array) => {
      //clicking each eye-icon in the list to verify event details
      cy.wrap($element).scrollIntoView().click({ force: true });
      tenantAdminObj
        .eventDetails()
        .invoke('text')
        .then((eventDetails) => {
          // Check if event log details contains expected info
          if (
            eventDetails.includes('to": "' + email) &&
            eventDetails.includes(appName + ' status changed to') &&
            eventDetails.includes(
              'from <b>' + orgStatusValidationString + '</b> to <b>' + newStatusValidationString + '</b>'
            )
          ) {
            isFound = true;
            cy.wrap($element).click({ force: true });
          } else {
            //clicking eye icon to close event details
            cy.wrap($element).scrollIntoView().click({ force: true });
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
