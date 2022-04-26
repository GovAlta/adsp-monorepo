import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import NotificationsPage from './notifications.page';

const commonObj = new common();
const notificationsObj = new NotificationsPage();
let emailInput;
let phoneInput;
let instructionsInput;

Given('a tenant admin user is on notification overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Notification', 4000);
});

When('the user clicks Add notification type button', function () {
  notificationsObj.addANotificationTypeButtonOnOverview().click();
});

Then('the user views Add notification type modal', function () {
  notificationsObj.notificationTypeModal().should('exist');
});

When(
  'the user enters {string}, {string}, {string}, {string} on notification type modal',
  function (name, description, role, selfService) {
    const roles = role.split(',');
    notificationsObj.notificationTypeModalNameField().clear().type(name);
    notificationsObj.notificationTypeModalDescriptionField().clear().type(description);
    notificationsObj.notificationTypeModalSubscriberRolesDropdown().click();
    for (let i = 0; i < roles.length; i++) {
      notificationsObj.notificationTypeModalSubscriberRolesDropdownItem(roles[i].trim()).click();
    }
    notificationsObj.notificationTypeModalSubscriberRolesDropdownBackground().click({ force: true }); // To collapse the dropdown after selection
    //Self-service checkbox
    notificationsObj
      .notificationTypeModalSelfServiceCheckbox()
      .invoke('attr', 'class')
      .then((classAttVal) => {
        if (classAttVal == undefined) {
          expect.fail('Failed to get subscribe checkbox class attribute value.');
        } else {
          switch (selfService) {
            case 'yes':
              if (classAttVal.includes('selected')) {
                cy.log('Self service check box is already selected. ');
              } else {
                notificationsObj.notificationTypeModalSelfServiceCheckbox().click();
                notificationsObj.notificationTypeModalSelfServiceCalloutContent().should('be.visible');
              }
              break;
            case 'no':
              {
                if (!classAttVal.includes('selected')) {
                  cy.log('Self service check box is already not selected. ');
                } else {
                  notificationsObj.notificationTypeModalSelfServiceCheckbox().click();
                  notificationsObj.notificationTypeModalSelfServiceCalloutContent().should('not.exist');
                }
              }
              break;
            default:
              expect(selfService).to.be.oneOf(['yes', 'no']);
          }
        }
      });
  }
);

Then('the user clicks save button', function () {
  notificationsObj.notificationTypeModalSaveBtn().click();
});

Then(
  'the user {string} the notification type card of {string}, {string}, {string}, {string}, {string}',
  function (viewOrNot, name, desc, roles, publicOrNot, selfService) {
    roles = roles.replace('Anyone (Anonymous)', '');
    if (viewOrNot == 'views') {
      notificationsObj.notificationTypeCardTitle(name).should('exist');
      notificationsObj.notificationTypeCardDesc(name).invoke('text').should('contain', desc);
      notificationsObj.notificationTypeSubscriberRoles(name).invoke('text').should('contain', roles);
      notificationsObj.notificationTypePublicSubscription(name).invoke('text').should('contain', publicOrNot);
      notificationsObj.notificationTypeSelfService(name).invoke('text').should('contain', selfService);
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

Given('a tenant admin user is on notification types page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Notification', 4000);
  commonObj.serviceTab('Notification', 'Notification types').click();
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
  notificationsObj.addAnEmailTemplateModalTitle().invoke('text').should('contain', 'Add an email template');
});

When('the user enters {string} as subject and {string} as body', function (subjectText, bodyText) {
  notificationsObj.addAnEmailTemplateModalSubject().type(subjectText);
  notificationsObj.addAnEmailTemplateModalBody().type(bodyText);
});

When('the user clicks Add button in Add an email template page', function () {
  notificationsObj.addAnEmailTemplateModalAddBtn().click();
});

Then('the user {string} the event of {string} in {string}', function (viewOrNot, event, cardTitle) {
  cy.wait(2000); // To wait for the record to show up in the grid before validating the record existence
  let numOfMatch = 0;
  if (viewOrNot == 'views') {
    notificationsObj.notificationTypeEvents(cardTitle).then((elements) => {
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerText == event) numOfMatch = numOfMatch + 1;
      }
      expect(numOfMatch).equals(1);
    });
  } else if (viewOrNot == 'should not view') {
    notificationsObj.notificationTypeCardFooterItems(cardTitle).then((footerItems) => {
      if (footerItems.length == 1) {
        cy.log('No event for the notification type');
      } else {
        notificationsObj.notificationTypeEvents(cardTitle).then((elements) => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].innerText == event) numOfMatch = numOfMatch + 1;
          }
          expect(numOfMatch).equals(0);
        });
      }
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

Then('the user {string} the notification type card of {string}', function (viewOrNot, name) {
  if (viewOrNot == 'views') {
    notificationsObj.notificationTypeCardTitle(name).should('exist');
  } else if (viewOrNot == 'should not view') {
    notificationsObj.notificationTypeCardTitle(name).should('not.exist');
  } else {
    expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

Then(
  'the user views {string} has self-service-allowed attribute is {string}',
  function (notificationTypeName, selfService) {
    expect(selfService).to.be.oneOf(['yes', 'no']);
    notificationsObj
      .notificationTypeCoreSelfService(notificationTypeName)
      .invoke('text')
      .should('contain', selfService);
  }
);

Then('the user {string} {string} for {string} in {string}', function (viewOrNot, elementType, eventName, typeName) {
  if (viewOrNot == 'views') {
    switch (elementType) {
      case 'email template indicator':
        notificationsObj.internalNotificationTypeEventMailIcon(typeName, eventName).should('exist');
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
  commonlib.tenantAdminMenuItem('Notification', 4000);
  commonObj.serviceTab('Notification', 'Subscriptions').click();
  cy.wait(5000);
});

When(
  'the user types {string} in Search subuscriber address as field and {string} in Search subscriber email field',
  function (addressAs, email) {
    notificationsObj.searchSubscriberAddressAs().clear().type(addressAs);
    notificationsObj.searchSubscriberEmail().clear().type(email);
  }
);

When('the user types {string} in Search subscriber email field', function (email) {
  notificationsObj.searchSubscriberEmail().clear().type(email);
});

When('the user clicks Search button on notifications page', function () {
  notificationsObj.notificationSearchBtn().click();
});

//notification type in sentence case, only first letter is upper case
Then(
  'the user {string} the subscription of {string}, {string} under {string}',
  function (viewOrNot, addressAd, email, notificationType) {
    switch (viewOrNot) {
      case 'views':
        notificationsObj.notificationRecord(notificationType, addressAd, email).should('exist');
        break;
      case 'should not view':
        notificationsObj.notificationRecord(notificationType, addressAd, email).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

When(
  'the user clicks delete button of {string}, {string} under {string}',
  function (addressAd, email, notificationType) {
    notificationsObj.deleteIconForNotificationRecord(notificationType, addressAd, email).click();
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

Given('a tenant admin user is on notification subscribers page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Notification', 4000);
  commonObj.serviceTab('Notification', 'Subscribers').click();
  cy.wait(5000);
});

When('the user searches subscribers with {string} containing {string}', function (searchField, searchText) {
  //Enter search text
  switch (searchField) {
    case 'address as':
      notificationsObj.subscribersAddressAsSearchField().clear().type(searchText);
      notificationsObj.subscribersEmailSearchField().clear();
      break;
    case 'email':
      notificationsObj.subscribersEmailSearchField().clear().type(searchText);
      notificationsObj.subscribersAddressAsSearchField().clear();
      break;
    default:
      expect(searchField).to.be.oneOf(['address as', 'email']);
  }

  //Click Search button
  notificationsObj.subscribersSearchBtn().click();
  cy.wait(2000);
});

When(
  'the user searches subscribers with address as containing {string} and email containing {string}',
  function (addressAsSearchText, emailSearchText) {
    //Enter search text
    notificationsObj.subscribersAddressAsSearchField().clear().type(addressAsSearchText);
    notificationsObj.subscribersEmailSearchField().clear().type(emailSearchText);

    //Click Search button
    notificationsObj.subscribersSearchBtn().click();
    cy.wait(2000);
  }
);

Then('the user views all the subscribers with {string} containing {string}', function (headerLabel, searchText) {
  //Find which column to search
  let columnNumber;
  notificationsObj
    .subscriberTableHeader()
    .get('th')
    .then((elements) => {
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerText.toLowerCase() == headerLabel) {
          columnNumber = i;
        }
      }
    });

  //Search all cells of the column
  notificationsObj.subscriberTableBody().each((rows) => {
    cy.wrap(rows).within(() => {
      cy.get('td').each(($col, index) => {
        if (index == columnNumber) {
          expect($col.text().toLowerCase()).to.contain(searchText.toLowerCase());
        }
      });
    });
  });
});

Then(
  'the user views subscribers with {string} containing {string} and {string} containing {string}',
  function (headerLabel1, searchText1, headerLabel2, searchText2) {
    //Find which columns to search
    let columnNumber1;
    let columnNumber2;
    notificationsObj
      .subscriberTableHeader()
      .get('th')
      .then((elements) => {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].innerText.toLowerCase() == headerLabel1) {
            columnNumber1 = i;
          } else if (elements[i].innerText.toLowerCase() == headerLabel2) {
            columnNumber2 = i;
          }
        }
      });

    //Search all cells of the columns
    notificationsObj.subscriberTableBody().each((rows) => {
      cy.wrap(rows).within(() => {
        cy.get('td').each(($col, index) => {
          if (index == columnNumber1) {
            expect($col.text().toLowerCase()).to.contain(searchText1.toLowerCase());
          } else if (index == columnNumber2) {
            expect($col.text().toLowerCase()).to.contain(searchText2.toLowerCase());
          }
        });
      });
    });
  }
);

When('the user expands the subscription list for the subscriber of {string} and {string}', function (addressAs, email) {
  notificationsObj.subscriberIconEye(addressAs, email).click();
});

Then(
  'the user views the subscription of {string} for the subscriber of {string} and {string}',
  function (subscription, addressAs, email) {
    notificationsObj.subscriberSubscriptions(addressAs, email).invoke('text').should('contain', subscription);
  }
);

Then('the user {string} the subscriber of {string}, {string}', function (viewOrNot, addressAs, email) {
  switch (viewOrNot) {
    case 'views':
      notificationsObj.subscriber(addressAs, email).should('exist');
      break;
    case 'should not view':
      notificationsObj.subscriber(addressAs, email).should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

When('the user clicks delete button of {string}, {string} on subscribers page', function (addressAs, email) {
  notificationsObj.subscriberDeleteIcon(addressAs, email).click();
});

Then('the user views Delete subscriber modal', function () {
  notificationsObj.subscriberDeleteConfirmationModalTitle().invoke('text').should('eq', 'Delete subscriber');
});

When('the user clicks Delete button on Delete subscriber modal', function () {
  notificationsObj.subscriberDeleteConfirmationModalDeleteBtn().click();
  cy.wait(4000); //Wait for the subscriber list to be updated
});

When('the user clicks edit button for contact information', function () {
  notificationsObj.contactInformationEdit().click();
});

Then('the user views Edit contact information modal', function () {
  notificationsObj.editContactModal().should('exist');
});

When(
  'the user enters {string}, {string} and {string} in Edit contact information modal',
  function (email, phone, instructions) {
    // Check phone parameter to match 1 (111) 111-1111 format
    expect(phone).to.match(/1\s\(\d{3}\)\s\d{3}-\d{4}/g);
    // Generate a random number between 1000 and 2000
    const rand_str = String(Math.floor(Math.random() * 1000 + 1000));

    const editedEmail = email.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (editedEmail == null) {
      emailInput = email;
    } else {
      emailInput = (rand_str + email).replace('rnd{', '').replace('}', '');
    }

    const editedPhone = phone.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (editedPhone == null) {
      phoneInput = phone;
    } else {
      phoneInput = editedPhone.toString().slice(0, -4) + rand_str;
    }

    const editedInstructions = instructions.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (editedInstructions == null) {
      instructionsInput = instructions;
    } else {
      instructionsInput = (rand_str + instructions).replace('rnd{', '').replace('}', '');
    }

    notificationsObj.editContactModalEmail().clear().type(emailInput);
    // Remove (, ), - and spaces and the first number
    const phoneInputForUI = phoneInput
      .replace('(', '')
      .replace(')', '')
      .replaceAll(' ', '')
      .replace('-', '')
      .substring(1);

    notificationsObj.editContactModalPhone().clear().type(phoneInputForUI);
    notificationsObj.editContactModalInstructions().clear().type(instructionsInput);
  }
);

Then('the user clicks Save button in Edit contact information modal', function () {
  notificationsObj.editContactModalSaveBtn().click();
  cy.wait(2000);
});

Then(
  'the user views contact information of {string}, {string} and {string} on notifications page',
  function (email, phone, instructions) {
    const editedEmail = email.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (editedEmail == '') {
      notificationsObj.contactInformationEmail().invoke('text').should('contain', email);
    } else {
      notificationsObj.contactInformationEmail().invoke('text').should('contain', emailInput);
    }

    const editedPhone = phone.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (editedPhone == '') {
      notificationsObj.contactInformationPhone().invoke('text').should('contain', phone);
    } else {
      notificationsObj.contactInformationPhone().invoke('text').should('contain', phoneInput);
    }

    const editedInstructions = instructions.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (editedInstructions == '') {
      notificationsObj.contactInformationInstructions().invoke('text').should('contain', instructions);
    } else {
      notificationsObj.contactInformationInstructions().invoke('text').should('contain', instructionsInput);
    }
  }
);
