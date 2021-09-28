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
  commonObj
    .adminMenuItem('/admin/services/status')
    .click()
    .then(function () {
      cy.url().should('include', '/admin/services/status');
      cy.wait(4000);
    });
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
  commonObj
    .adminMenuItem('/admin/services/status')
    .click()
    .then(function () {
      cy.url().should('include', '/admin/services/status');
      cy.wait(4000);
    });
  commonObj.serviceTab('Status', 'Notices').click();
  cy.wait(10000);
});

When('the user clicks add a Draft Notice button', function () {
  statusObj.addNoticeButton().click();
});

Then('the user views Add a Draft Notice dialog', function () {
  statusObj.noticeModalTitle().invoke('text').should('eq', 'Add a Draft Notice');
});

//Date time picker UI isn't finalized and the step uses the default dates and times without entering any data/time data
When(
  'the user enters {string}, {string}, {string}, {string}, {string},  {string}',
  function (desc, app, startDate, startTime, endDate, endTime) {
    statusObj.noticeModalDescField().clear().type(desc);
    statusObj.noticeModalApplicationDropdown().click();
    statusObj.noticeModalApplicationDropdownItem(app).click();
    cy.log(startDate, startTime, endDate, endTime);
  }
);

When('the user clicks Save as Draft button', function () {
  statusObj.noticeModalSaveButton().click();
  cy.wait(1000);
});

// Date time picker UI isn't finalized and dates are today only for now
Then(
  'the user {string} the {string} notice of {string}, {string}, {string}, {string}, {string},  {string}',
  function (viewOrNot, mode, desc, app, startDate, startTime, endDate, endTime) {
    const currentTime = new Date();
    const todayDate = currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    expect(startDate).to.equal('Today');
    expect(endDate).to.equal('Today');
    const startDateTime = todayDate + ' at ' + startTime;
    const endDateTime = todayDate + ' at ' + endTime;
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
  'the user clicks {string} menu for the {string} notice of {string}, {string}, {string}, {string}, {string},  {string}',
  function (menu, mode, desc, app, startDate, startTime, endDate, endTime) {
    const currentTime = new Date();
    const todayDate = currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    expect(startDate).to.equal('Today');
    expect(endDate).to.equal('Today');
    const startDateTime = todayDate + ' at ' + startTime;
    const endDateTime = todayDate + ' at ' + endTime;
    searchNoticeCards(mode, desc, app, startDateTime, endDateTime).then((index) => {
      statusObj.noticeCardGearButton(index).click();
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
  }
);

Then('the user views Edit Draft Notice dialog', function () {
  statusObj.noticeModalTitle().invoke('text').should('eq', 'Edit Draft Notice');
});

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
