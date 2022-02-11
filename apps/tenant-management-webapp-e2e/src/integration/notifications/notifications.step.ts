import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import NotificationsPage from './notifications.page';

const commonObj = new common();
const notificationsObj = new NotificationsPage();

Given('a tenant admin user is on notification overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Notifications', 4000);
});

When('the user clicks Add notification type button', function () {
  notificationsObj.addANotificationTypeButtonOnOverview().click();
});

Then('the user views Add notification modal', function () {
  notificationsObj.notificationTypeModal().should('exist');
});

When('the user enters {string}, {string}, {string} on notification modal', function (name, description, role) {
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

Given('a tenant admin user is on notification types page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Notifications', 4000);
  commonObj.serviceTab('Notifications', 'Notification types').click();
  cy.wait(2000);
});

When('the user clicks Select event button for {string}', function (cardTitle) {
  notificationsObj.notificationTypeSelectAnEventBtn(cardTitle).click();
});

Then('the user views Select an event modal', function () {
  notificationsObj.selectAnEventModalTitle().invoke('text').should('equal', 'Select an event');
});

When('the user selects {string} in the event dropdown', function (event) {
  notificationsObj.selectAnEventModalEventDropdown().click();
  notificationsObj.selectAnEventModalEventDropdownItem(event).click();
});

When('the user cannot select {string} in the event dropdown', function (event) {
  notificationsObj.selectAnEventModalEventDropdown().click();
  notificationsObj.selectAnEventModalEventDropdownItem(event).should('not.exist');
  notificationsObj.selectAnEventModalEventDropdown().click({ force: true }); //Force clicking the dropdown to collapse the dropdown
});

When('the user clicks Next button on Select an event page', function () {
  notificationsObj.selectAnEventModalNextBtn().click();
});

When('the user clicks Cancel button in Select an event modal', function () {
  notificationsObj.selectAnEventModalCancelBtn().click();
});

Then('the user views Add an email template page', function () {
  notificationsObj.addAnEmailTemplateModalTitle().invoke('text').should('equal', 'Add an email template');
});

When('the user enters {string} as subject and {string} as body', function (subjectText, bodyText) {
  notificationsObj.addAnEmailTemplateModalSubject().type(subjectText);
  notificationsObj.addAnEmailTemplateModalBody().type(bodyText);
});

When('the user clicks Add button in Add an email template page', function () {
  notificationsObj.addAnEmailTemplateModalAddBtn().click();
});

Then('the user {string} the event of {string} in {string}', function (viewOrNot, event, cardTitle) {
  cy.wait(1000); // To wait for the record to show up in the grid before validating the record existence
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
  notificationsObj.removeEventModalTitle().invoke('text').should('contain', 'Remove event');
  notificationsObj.removeEventModalContent().invoke('text').should('contain', event);
});

When('the user clicks Confirm button in Remove event modal', function () {
  notificationsObj.removeEventModalConfirmBtn().click();
});

Then('the user {string} the notification type card of {string}', function (viewOrNot, name) {
  if (viewOrNot == 'views') {
    notificationsObj.notificationTypeCardTitle(name).should('exist');
  } else if (viewOrNot == 'should not view') {
    notificationsObj.notificationTypeCardTitle(name).should('not.exist');
  } else {
    expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

Then('the user {string} {string} for {string} in {string}', function (viewOrNot, elementType, eventName, typeName) {
  if (viewOrNot == 'views') {
    switch (elementType) {
      case 'email template indicator':
        notificationsObj.internalNotificationTypeEventMailIcon(typeName, eventName).should('exist');
        break;
      case 'Preview link':
        notificationsObj.internalNotificationTypeEventPreviewLink(typeName, eventName).should('exist');
        break;
      case 'Edit button':
        notificationsObj.internalNotificationTypeEventEditButton(typeName, eventName).should('exist');
        break;
      case 'Reset':
        notificationsObj.internalNotificationTypeEventResetBtn(typeName, eventName).should('exist');
        break;
      default:
        expect(elementType).to.be.oneOf(['email template indicator', 'Preview link', 'Edit button', 'Reset']);
    }
  } else if (viewOrNot == 'should not view') {
    switch (elementType) {
      case 'email template indicator':
        notificationsObj.internalNotificationTypeEventMailIcon(typeName, eventName).should('not.exist');
        break;
      case 'Preview link':
        notificationsObj.internalNotificationTypeEventPreviewLink(typeName, eventName).should('not.exist');
        break;
      case 'Edit button':
        notificationsObj.internalNotificationTypeEventEditButton(typeName, eventName).should('not.exist');
        break;
      case 'Reset':
        notificationsObj.internalNotificationTypeEventResetBtn(typeName, eventName).should('not.exist');
        break;
      default:
        expect(elementType).to.be.oneOf(['email template indicator', 'Preview link', 'Edit button', 'Reset']);
    }
  } else {
    expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

When('the user clicks Preview button on {string} in {string}', function (eventName, typeName) {
  notificationsObj.internalNotificationTypeEventPreviewLink(typeName, eventName).click();
});

Then('the user views Preview an email template modal', function () {
  notificationsObj.eventTemplatePreviewModalTitle().invoke('text').should('contain', 'Preview an email template');
});

When('the user clicks Close button in Preview an email template modal', function () {
  notificationsObj.eventTemplatePreviewModalCloseBtn().click();
});

Then('Preview an email template modal is closed', function () {
  notificationsObj.eventTemplatePreviewModal().should('not.exist');
});

Given('a tenant admin user is on notification subscriptions page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Notifications', 4000);
  commonObj.serviceTab('Notifications', 'Subscriptions').click();
  cy.wait(5000);
});

When(
  'the user types {string} in Search subuscriber address as field and {string} in Search subscriber email field',
  function (addressAs, email) {
    notificationsObj.searchSubscriberAddressAs().clear().type(addressAs);
    notificationsObj.searchSubscriberEmail().clear().type(email);
  }
);

When('the user clicks Search button on notifications page', function () {
  notificationsObj.notificationSearchBtn().click();
});

Then(
  'the user {string} the subscription of {string}, {string} under {string}',
  function (viewOrNot, addressAd, email, notificationType) {
    switch (viewOrNot) {
      case 'views':
        notificationsObj.notificationRecord(notificationType.toLowerCase(), addressAd, email).should('exist');
        break;
      case 'should not view':
        notificationsObj.notificationRecord(notificationType.toLowerCase(), addressAd, email).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

When(
  'the user clicks delete button of {string}, {string} under {string}',
  function (addressAd, email, notificationType) {
    notificationsObj.deleteIconForNotificationRecord(notificationType.toLowerCase(), addressAd, email).click();
  }
);

Then('the user views Delete subscription modal', function () {
  notificationsObj.deleteConfirmationModal().should('exist');
  notificationsObj.deleteConfirmationModalTitle().invoke('text').should('eq', 'Delete subscription');
});

Then('the user views the Delete subscription confirmation message of {string}', function (email) {
  notificationsObj.deleteConfirmationModalContent().should('contain.text', email);
});

When('the user clicks Confirm button on Delete subscription modal', function () {
  notificationsObj.deleteConfirmationModalConfirmBtn().click();
});
