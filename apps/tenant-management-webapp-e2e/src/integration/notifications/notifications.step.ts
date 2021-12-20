import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import notificationsPage from './notifications.page';

const commonObj = new common();
const notificationsObj = new notificationsPage();

Given('a service owner user is on notification overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonObj
    .adminMenuItem('/admin/services/notifications')
    .click()
    .then(function () {
      cy.url().should('include', '/admin/services/notifications');
      cy.wait(4000);
    });
});

When('the user clicks Add notification type button', function () {
  notificationsObj.addANotificationTypeButtonOnOverview().click();
});

Then('the user views Add notification modal', function () {
  notificationsObj.notificationTypeModal().should('exist');
});

When('the user enters {string}, {string}, {string}', function (name, description, role) {
  const roles = role.split(',');
  notificationsObj.notificationTypeModalNameField().clear().type(name);
  notificationsObj.notificationTypeModalDescriptionField().clear().type(description);
  notificationsObj.notificationTypeModalSubscriberRolesDropdown().click();
  for (let i = 0; i < roles.length; i++) {
    notificationsObj.notificationTypeModalSubscriberRolesDropdownItem(roles[i].trim()).click();
  }
  notificationsObj.notificationTypeModalSubscriberRolesDropdownBackground().click({ force: true }); // To collapse the dropdown after selection
});

Then('the user clicks save button', function () {
  notificationsObj.notificationTypeModalSaveBtn().click();
});

Then(
  'the user {string} the notification type card of {string}, {string}, {string}, {string}',
  function (viewOrNot, name, desc, roles, publicOrNot) {
    roles = roles.replace('Anyone (Anonymous)', '');
    if (viewOrNot == 'views') {
      notificationsObj.notificationTypeCardTitle(name).should('exist');
      notificationsObj.notificationTypeCardDesc(name).invoke('text').should('contain', desc);
      notificationsObj.notificationTypeSubscriberRoles(name).invoke('text').should('contain', roles);
      notificationsObj.notificationTypePublicSubscription(name).invoke('text').should('contain', publicOrNot);
    } else if (viewOrNot == 'should not view') {
      notificationsObj.notificationTypeCardTitle(name).should('not.exist');
    } else {
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

Then('the user views Add notification type button on Notification types page', function () {
  notificationsObj.addANotificationTypeButtonOnNotificationTypesPage().should('exist');
});

When('the user clicks {string} button for the notification type card of {string}', function (buttonType, cardTitle) {
  switch (buttonType) {
    case 'edit':
      notificationsObj.notificationTypeEditBtn(cardTitle).click();
      break;
    case 'delete':
      notificationsObj.notificationTypeDeleteBtn(cardTitle).click();
      break;
    default:
      expect(buttonType).to.be.oneOf(['edit', 'delete']);
  }
});

Then('the user views Edit notification type modal for {string}', function (cardTitle) {
  notificationsObj.notificationTypeModalTitle().invoke('text').should('eq', 'Edit notification type');
  notificationsObj.notificationTypeModalNameField().invoke('attr', 'value').should('eq', cardTitle);
});

Then('the user views delete confirmation modal for {string}', function (cardTitle) {
  notificationsObj
    .notificationTypeDeleteConfirmationModalTitle()
    .invoke('text')
    .should('eq', 'Delete notification type');
  notificationsObj.notificationTypeDeleteConfirmationModal().invoke('text').should('contains', cardTitle);
});

When('the user clicks Confirm button on delete confirmation modal', function () {
  notificationsObj.notificationTypeDeleteConfirmationModalConfirmBtn().click();
});

Given('a service owner user is on notification types page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonObj
    .adminMenuItem('/admin/services/notifications')
    .click()
    .then(function () {
      cy.url().should('include', '/admin/services/notifications');
      cy.wait(4000);
    });
  commonObj.serviceTab('Notifications', 'Notification types').click();
  cy.wait(2000);
});

When('the user clicks Select event button for {string}', function (cardTitle) {
  notificationsObj.notificationTypeSelectAnEventBtn(cardTitle);
});

Then('the user views Select event modal', function () {
  notificationsObj.notificationTypeSelectAnEventModal().should('exist');
});

When('the user selects {string} in the event dropdown', function (event) {
  notificationsObj.notificationTypeSelectAnEventModalEventDropdown().click();
  notificationsObj.notificationTypeSelectAnEventModalEventDropdownItem(event).click();
});

Then('the user clicks Save button in Select event modal', function () {
  notificationsObj.notificationTypeModalSaveBtn().click();
});

Then('the user {string} the event of {string} in {string}', function (viewOrNot, event, cardTitle) {
  let numOfMatch = 0;
  if (viewOrNot == 'views') {
    notificationsObj.notificationTypeEvents(cardTitle).then((elements) => {
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerText == event) numOfMatch = numOfMatch + 1;
      }
      expect(numOfMatch).equals(1);
    });
  } else if (viewOrNot == 'should not view') {
    notificationsObj.notificationTypeEvents(cardTitle).then((elements) => {
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerText == event) numOfMatch = numOfMatch + 1;
      }
      expect(numOfMatch).equals(0);
    });
  } else {
    expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});
