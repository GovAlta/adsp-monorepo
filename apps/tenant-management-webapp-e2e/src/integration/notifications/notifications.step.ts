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
  notificationsObj.NotificationTypeSelectAnEventBtn(cardTitle).click();
});

Then('the user views Select an event modal', function () {
  notificationsObj.SelectAnEventModalTitle().invoke('text').should('equal', 'Select an event');
});

When('the user selects {string} in the event dropdown', function (event) {
  notificationsObj.SelectAnEventModalEventDropdown().click();
  notificationsObj.SelectAnEventModalEventDropdownItem(event).click();
});

When('the user cannot select {string} in the event dropdown', function (event) {
  notificationsObj.SelectAnEventModalEventDropdown().click();
  notificationsObj.SelectAnEventModalEventDropdownItem(event).should('not.exist');
  notificationsObj.SelectAnEventModalEventDropdown().click({ force: true }); //Force clicking the dropdown to collapse the dropdown
});

When('the user clicks Next button on Select an event page', function () {
  notificationsObj.SelectAnEventModalNextBtn().click();
});

When('the user clicks Cancel button in Select an event modal', function () {
  notificationsObj.SelectAnEventModalCancelBtn().click();
});

Then('the user views Add an email template page', function () {
  notificationsObj.AddAnEmailTemplateModalTitle().invoke('text').should('equal', 'Add an email template');
});

When('the user enter {string} as subject and {string} as body', function (subjectText, bodyText) {
  notificationsObj.AddAnEmailTemplateModalSubject().type(subjectText);
  notificationsObj.AddAnEmailTemplateModalBody().type(bodyText);
});

When('the user clicks Add button in Add an email template page', function () {
  notificationsObj.AddAnEmailTemplateModalAddBtn().click();
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

When('the user clicks {string} button for {string} in {string}', function (buttonName, event, cardTitle) {
  switch (buttonName) {
    case 'delete':
      notificationsObj.eventDeleteIcon(cardTitle, event).click();
      break;
    default:
      expect(buttonName).to.be.oneOf(['delete']);
  }
});

Then('the user views Remove event modal for {string}', function (event) {
  notificationsObj.removeEventModalTitle().invoke('text').should('equal', 'Remove event');
  notificationsObj.removeEventModalContent().invoke('text').should('contain', event);
});

When('the user clicks Confirm button in Remove event modal', function () {
  notificationsObj.removeEventModalConfirmBtn().click();
});
