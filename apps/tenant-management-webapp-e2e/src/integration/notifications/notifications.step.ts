import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
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
  notificationsObj.addANotificationTypeButtonOnOverview().shadow().find('button').click({ force: true });
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Add notification type modal', function () {
  notificationsObj.notificationTypeModal().should('exist');
});

// Known issue: scrollbar to scroll to a specific role element doesn't work with .scrollIntoView() in Cypress. Only the viewable roles are useable for now.
When(
  'the user enters {string}, {string}, {string}, {string}, {string}, {string} on notification type modal',
  function (name: string, description: string, role: string, bot, sms, selfService) {
    const roles = role.split(',');
    notificationsObj
      .notificationTypeModalNameField()
      .shadow()
      .find('input')
      .clear()
      .type(name, { delay: 200, force: true });
    notificationsObj
      .notificationTypeModalDescriptionField()
      .shadow()
      .find('textarea')
      .clear()
      .type(description, { force: true });
    // Public or select roles
    notificationsObj
      .notificationTypeModalPublicCheckbox()
      .shadow()
      .find('[class^="container"]')
      .invoke('attr', 'class')
      .then((publicCheckboxClassName) => {
        if (role.toLowerCase() === 'public') {
          if (!publicCheckboxClassName?.includes('selected')) {
            notificationsObj
              .notificationTypeModalPublicCheckbox()
              .shadow()
              .find('[class^="container"]')
              .click({ force: true });
          }
        } else {
          if (publicCheckboxClassName?.includes('selected')) {
            notificationsObj
              .notificationTypeModalPublicCheckbox()
              .shadow()
              .find('[class^="container"]')
              .click({ force: true });
          }
          // Deselect all previously selected roles and then select new roles
          notificationsObj
            .notificationTypeModalRolesTable()
            .find('goa-checkbox')
            .shadow()
            .find('[class^="container"]')
            .then((elements) => {
              for (let i = 0; i < elements.length; i++) {
                if (elements[i].className?.includes('selected')) {
                  elements[i].click();
                }
              }
            })
            .then(() => {
              for (let i = 0; i < roles.length; i++) {
                cy.wait(1000); //Wait the checkbox components to settle down before selecting a role
                if (roles[i].includes(':')) {
                  notificationsObj
                    .notificationTypeModalClientRoleCheckbox(roles[i].trim())
                    .shadow()
                    .find('[class^="container"]')
                    .click();
                } else {
                  notificationsObj
                    .notificationTypeModalRolesTable()
                    .find('goa-checkbox[name="Notifications-type-subscribe-role-checkbox-' + roles[i].trim() + '"]')
                    .shadow()
                    .find('[class^="container"]')
                    .click({ force: true });
                }
              }
            });
        }
      });

    //bot checkbox
    notificationsObj
      .notificationChannelCheckbox('bot')
      .shadow()
      .find('[class^="container"]')
      .invoke('attr', 'class')
      .then((classAttVal) => {
        if (classAttVal == undefined) {
          expect.fail('Failed to get bot checkbox class attribute value.');
        } else {
          switch (bot) {
            case 'yes':
              if (classAttVal.includes('selected')) {
                cy.log('Bot check box is already selected. ');
              } else {
                notificationsObj.notificationChannelCheckbox('bot').shadow().find('[class^="container"]').click();
              }
              break;
            case 'no':
              {
                if (!classAttVal.includes('selected')) {
                  cy.log('Bot check box is already not selected. ');
                } else {
                  notificationsObj.notificationChannelCheckbox('bot').shadow().find('[class^="container"]').click();
                }
              }
              break;
            default:
              expect(bot).to.be.oneOf(['yes', 'no']);
          }
        }
      });
    //sms checkbox
    notificationsObj
      .notificationChannelCheckbox('sms')
      .shadow()
      .find('[class^="container"]')
      .invoke('attr', 'class')
      .then((classAttVal) => {
        if (classAttVal == undefined) {
          expect.fail('Failed to get sms checkbox class attribute value.');
        } else {
          switch (sms) {
            case 'yes':
              if (classAttVal.includes('selected')) {
                cy.log('SMS check box is already selected. ');
              } else {
                notificationsObj.notificationChannelCheckbox('sms').shadow().find('[class^="container"]').click();
              }
              break;
            case 'no':
              {
                if (!classAttVal.includes('selected')) {
                  cy.log('SMS check box is already not selected. ');
                } else {
                  notificationsObj.notificationChannelCheckbox('sms').shadow().find('[class^="container"]').click();
                }
              }
              break;
            default:
              expect(sms).to.be.oneOf(['yes', 'no']);
          }
        }
      });
    //Self-service checkbox
    notificationsObj
      .notificationTypeModalSelfServiceCheckbox()
      .shadow()
      .find('[class^="container"]')
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
                notificationsObj
                  .notificationTypeModalSelfServiceCheckbox()
                  .shadow()
                  .find('[class^="container"]')
                  .click({ force: true });
                notificationsObj.notificationTypeModalSelfServiceCalloutContent().scrollIntoView().should('be.visible');
              }
              break;
            case 'no':
              {
                if (!classAttVal.includes('selected')) {
                  cy.log('Self service check box is already not selected. ');
                } else {
                  notificationsObj
                    .notificationTypeModalSelfServiceCheckbox()
                    .shadow()
                    .find('[class^="container"]')
                    .click();
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

Then('the user clicks Save button in notification type modal', function () {
  notificationsObj.notificationTypeModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user clicks Cancel button in notification type modal', function () {
  notificationsObj.notificationTypeModalCancelBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then(
  'the user {string} the notification type card of {string}, {string}, {string}, {string}, {string}',
  function (viewOrNot, name, desc, roles: string, publicOrNot, selfService) {
    roles = roles.replace('public', '');
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
      notificationsObj.notificationTypeEditBtn(cardTitle).shadow().find('button').click({ force: true });
      cy.wait(2000); // wait for roles to show up for editing
      break;
    case 'delete':
      notificationsObj.notificationTypeDeleteBtn(cardTitle).shadow().find('button').click({ force: true });
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
  notificationsObj
    .notificationTypeSelectAnEventBtn(cardTitle)
    .shadow()
    .find('button')
    .scrollIntoView()
    .click({ force: true });
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Select an event modal', function () {
  notificationsObj.selectAnEventModalTitle().invoke('text').should('equal', 'Select an event');
});

When('the user selects {string} in the event dropdown', function (event) {
  notificationsObj
    .selectAnEventModalEventDropdown()
    .shadow()
    .find('[data-testid="event-dropdown"]')
    .click({ force: true });
  notificationsObj
    .selectAnEventModalEventDropdown()
    .shadow()
    .find('li[data-value="' + event + '"]')
    .scrollIntoView()
    .click({ force: true });
  cy.wait(1000);
});

When('the user cannot select {string} in the event dropdown', function (event) {
  notificationsObj.selectAnEventModalEventDropdown().shadow().find('[data-testid="event-dropdown"]').click();
  notificationsObj
    .selectAnEventModalEventDropdown()
    .shadow()
    .find('li[data-value="' + event + '"]')
    .should('not.exist');
  notificationsObj.selectAnEventModalEventDropdown().shadow().find('[data-testid="event-dropdown"]').click();
});

When('the user clicks Next button on Select an event page', function () {
  notificationsObj.selectAnEventModalNextBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks Cancel button in Select an event modal', function () {
  notificationsObj.selectAnEventModalCancelBtn().shadow().find('button').click({ force: true });
});

Then('the user views Add an email template page', function () {
  notificationsObj.addAnEmailTemplateModalTitle().invoke('text').should('contain', 'Add an email template');
});

When('the user clicks Add button in Add an email template page', function () {
  notificationsObj.addAnEmailTemplateModalAddBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
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

When('the user clicks {string} button for {string} in {string}', function (buttonName: string, event, cardTitle) {
  switch (buttonName.toLowerCase()) {
    case 'edit':
      notificationsObj.notificationTypeEventEditButton(cardTitle, event).click({ force: true });
      cy.wait(2000);
      break;
    case 'delete':
      notificationsObj.eventDeleteIcon(cardTitle, event).shadow().find('button').click({ force: true });
      break;
    case 'reset':
      notificationsObj.notificationTypeEventResetBtn(cardTitle, event).click({ force: true });
      break;
    default:
      expect(buttonName.toLowerCase()).to.be.oneOf(['edit', 'delete', 'reset']);
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
        notificationsObj.notificationTypeEventMailIcon(typeName, eventName).should('exist');
        break;
      case 'Edit button':
        notificationsObj.notificationTypeEventEditButton(typeName, eventName).should('exist');
        break;
      case 'Reset':
        notificationsObj.notificationTypeEventDeleteBtn(typeName, eventName).should('exist');
        break;
      default:
        expect(elementType).to.be.oneOf(['email template indicator', 'Preview link', 'Edit button', 'Reset']);
    }
  } else if (viewOrNot == 'should not view') {
    switch (elementType) {
      case 'email template indicator':
        notificationsObj.notificationTypeEventMailIcon(typeName, eventName).should('not.exist');
        break;
      case 'Edit button':
        notificationsObj.notificationTypeEventEditButton(typeName, eventName).should('not.exist');
        break;
      case 'Reset':
        notificationsObj.notificationTypeEventDeleteBtn(typeName, eventName).should('not.exist');
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
  notificationsObj.eventTemplatePreviewModalCloseBtn().shadow().find('button').click({ force: true });
});

Then('Preview event template modal is closed', function () {
  notificationsObj.eventTemplatePreviewModal().should('not.exist');
});

When(
  'the user types {string} in Search subuscriber address as field and {string} in Search subscriber email field',
  function (addressAs: string, email: string) {
    notificationsObj
      .searchSubscriberAddressAs()
      .shadow()
      .find('input')
      .clear()
      .type(addressAs, { delay: 100, force: true });
    notificationsObj.searchSubscriberEmail().shadow().find('input').clear().type(email, { delay: 100, force: true });
  }
);

When(
  'the user clicks delete button of {string}, {string} under {string}',
  function (addressAs, email, notificationType) {
    notificationsObj
      .deleteIconForNotificationRecord(notificationType, addressAs, email)
      .shadow()
      .find('button')
      .click({ force: true });
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
  notificationsObj.deleteConfirmationModalConfirmBtn().shadow().find('button').scrollIntoView().click({ force: true });
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
  cy.wait(4000);
});

When('the user searches subscribers with {string} containing {string}', function (searchField, searchText: string) {
  //Enter search text
  switch (searchField) {
    case 'address as':
      notificationsObj
        .subscribersAddressAsSearchField()
        .shadow()
        .find('input')
        .clear()
        .type(searchText, { delay: 100, force: true });
      notificationsObj.subscribersEmailSearchField().shadow().find('input').clear();
      break;
    case 'email':
      notificationsObj
        .subscribersEmailSearchField()
        .shadow()
        .find('input')
        .clear()
        .type(searchText, { delay: 100, force: true });
      notificationsObj.subscribersAddressAsSearchField().shadow().find('input').clear();
      break;
    default:
      expect(searchField).to.be.oneOf(['address as', 'email']);
  }

  //Click Search button
  notificationsObj.subscribersSearchBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When(
  'the user searches subscribers with address as containing {string}, email containing {string} and phone number containing {string}',
  function (addressAs: string, email: string, phoneNumber: string) {
    notificationsObj
      .searchSubscriberAddressAs()
      .shadow()
      .find('input')
      .clear()
      .type(addressAs, { delay: 100, force: true });
    notificationsObj.searchSubscriberEmail().shadow().find('input').clear().type(email, { delay: 100, force: true });
    expect(phoneNumber).match(/(EMPTY)|[0-9]{10}/);
    if (phoneNumber == 'EMPTY') {
      notificationsObj.searchSubscriberPhone().shadow().find('input').clear();
    } else {
      notificationsObj
        .searchSubscriberPhone()
        .shadow()
        .find('input')
        .clear()
        .type(phoneNumber, { delay: 100, force: true });
    }
    notificationsObj.notificationSearchBtn().shadow().find('button').click({ force: true });
    cy.wait(2000);
  }
);

Then(
  'the user views all the subscribers with {string} containing {string}',
  function (headerLabel, searchText: string) {
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
  }
);

Then(
  'the user views subscribers with {string} containing {string} and {string} containing {string}',
  function (headerLabel1, searchText1: string, headerLabel2, searchText2: string) {
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
  notificationsObj.subscriberIconEye(addressAs, email).shadow().find('button').click({ force: true });
});

Then(
  'the user views the subscription of {string} for the subscriber of {string} and {string}',
  function (subscription, addressAs, email) {
    notificationsObj.subscriberSubscriptions(addressAs, email).invoke('text').should('contain', subscription);
  }
);

Then(
  'the user {string} the subscriber of {string}, {string}, {string}',
  function (viewOrNot, addressAs, email, phoneNumber: string) {
    let phoneNumberInDisplay;
    expect(phoneNumber).match(/(EMPTY)|[0-9]{10}/);
    if (phoneNumber !== 'EMPTY') {
      phoneNumberInDisplay =
        phoneNumber.substring(0, 3) + ' ' + phoneNumber.substring(3, 6) + ' ' + phoneNumber.substring(6, 10);
    }
    switch (viewOrNot) {
      case 'views':
        if (phoneNumber == 'EMPTY') {
          notificationsObj.subscriber(addressAs, email).should('exist');
        } else {
          notificationsObj.subscriberWithPhoneNumber(addressAs, email, phoneNumberInDisplay).should('exist');
        }
        break;
      case 'should not view':
        if (phoneNumber == 'EMPTY') {
          notificationsObj.subscriber(addressAs, email).should('not.exist');
        } else {
          notificationsObj.subscriberWithPhoneNumber(addressAs, email, phoneNumberInDisplay).should('not.exist');
        }
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

When('the user clicks {string} button of {string}, {string} on subscribers page', function (button, addressAs, email) {
  switch (button) {
    case 'delete':
      notificationsObj.subscriberDeleteIcon(addressAs, email).shadow().find('button').click({ force: true });
      break;
    case 'edit':
      notificationsObj.subscriberEditIcon(addressAs, email).shadow().find('button').click({ force: true });
      break;
    default:
      expect(button).to.be.oneOf(['delete', 'edit']);
  }
});

Then('the user views Delete subscriber modal', function () {
  notificationsObj.subscriberDeleteConfirmationModalTitle().invoke('text').should('eq', 'Delete subscriber');
});

When('the user clicks Delete button on Delete subscriber modal', function () {
  notificationsObj.subscriberDeleteConfirmationModalDeleteBtn().shadow().find('button').click({ force: true });
  cy.wait(4000); //Wait for the subscriber list to be updated
});

When('the user clicks edit button for contact information', function () {
  notificationsObj.contactInformationEdit().shadow().find('button').click({ force: true });
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Edit contact information modal on notification overview page', function () {
  notificationsObj.editContactModal().should('exist');
});

When(
  'the user enters {string}, {string} and {string} in Edit contact information modal',
  function (email: string, phone: string, instructions: string) {
    // Check phone parameter to match 1111111 format
    // Generate a random number between 1000 and 2000
    const rand_str = String(Math.floor(Math.random() * 1000 + 1000));

    const editedEmail = email.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (editedEmail == null) {
      emailInput = email;
    } else {
      emailInput = (rand_str + email).replace(/rnd{/g, '').replace(/}/g, '');
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
      instructionsInput = (rand_str + instructions).replace(/rnd{/g, '').replace(/}/g, '');
    }
    notificationsObj
      .editContactModalEmail()
      .shadow()
      .find('input')
      .clear()
      .type(emailInput, { delay: 100, force: true });
    notificationsObj
      .editContactModalPhone()
      .shadow()
      .find('input')
      .clear()
      .type(phoneInput, { delay: 100, force: true });
    notificationsObj
      .editContactModalInstructions()
      .shadow()
      .find('textarea')
      .clear()
      .type(instructionsInput, { force: true });
  }
);

Then('the user clicks Save button in Edit contact information modal', function () {
  notificationsObj.editContactModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user clicks Cancel button in Edit contact information modal', function () {
  notificationsObj.editContactModalCancelBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then(
  'the user views contact information of {string}, {string} and {string} on notifications page',
  function (email: string, phone: string, instructions: string) {
    const editedEmail = email.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (!editedEmail) {
      notificationsObj.contactInformationEmail().invoke('text').should('contain', email);
    } else {
      notificationsObj.contactInformationEmail().invoke('text').should('contain', emailInput);
    }
    const editedPhone = phone.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (!editedPhone) {
      notificationsObj
        .contactInformationPhone()
        .invoke('text')
        .then(($text) => {
          const phoneNumber = $text
            .replace(/([^0-9])+/, '')
            .replace(' ', '')
            .replace(' ', '');
          cy.wrap(phoneNumber).should('contain', phoneInput);
        });
    } else {
      notificationsObj
        .contactInformationPhone()
        .invoke('text')
        .then(($text) => {
          const phoneNumber = $text
            .replace(/([^0-9])+/, '')
            .replace(' ', '')
            .replace(' ', '');
          cy.wrap(phoneNumber).should('contain', phoneInput);
        });
    }
    const editedInstructions = instructions.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (!editedInstructions) {
      notificationsObj.contactInformationInstructions().invoke('text').should('contain', instructions);
    } else {
      notificationsObj.contactInformationInstructions().invoke('text').should('contain', instructionsInput);
    }
  }
);

When(
  'the user modifies the name to {string} and email to {string} in subscriber modal',
  function (name: string, editEmail: string) {
    notificationsObj
      .editSubscriberModalNameField()
      .shadow()
      .find('input')
      .clear()
      .type(name, { delay: 100, force: true });
    notificationsObj
      .editSubscriberModalEmailField()
      .shadow()
      .find('input')
      .clear()
      .type(editEmail, { delay: 100, force: true });
  }
);

When('the user clicks Edit button of {string} and {string} on subscribers page', function (addressAs, email) {
  notificationsObj.subscriberEditIcon(addressAs, email).shadow().find('button').click({ force: true });
});

Then('the user views Edit subscriber modal', function () {
  notificationsObj.editSubscriberModal().should('exist');
});

Then('the user clicks Save button in Edit subscriber modal', function () {
  notificationsObj.editSubscriberModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user enters {string} in Phone number field', function (phoneNumber: string) {
  expect(phoneNumber).match(/(EMPTY)|[0-9]{10}/);
  if (phoneNumber !== 'EMPTY') {
    notificationsObj
      .editSubscriberModalPhoneNumberField()
      .shadow()
      .find('input')
      .clear()
      .type(phoneNumber, { delay: 100, force: true });
  } else {
    notificationsObj.editSubscriberModalPhoneNumberField().shadow().find('input').clear();
  }
});

When('the user clicks Add notification type button on Notification type page', function () {
  notificationsObj.addNotificationTypeBtnOnNotificationType().shadow().find('button').click({ force: true });
});

Then(
  'the user {string} {string} for the event of {string} in {string} on tenant events',
  function (viewOrNot, elementType, eventName, typeName) {
    if (viewOrNot == 'views') {
      switch (elementType) {
        case 'email template indicator':
          notificationsObj.tenantNotificationTypeEventMailIcon(typeName, eventName).should('exist');
          notificationsObj.tenantNotificationTypeEventMailBadge(typeName, eventName).should('not.exist');
          break;
        case 'bot template indicator':
          notificationsObj.tenantNotificationTypeEventBotIcon(typeName, eventName).should('exist');
          notificationsObj.tenantNotificationTypeEventBotIconBadge(typeName, eventName).should('not.exist');
          break;
        case 'sms template indicator':
          notificationsObj.tenantNotificationTypeEventSmsIcon(typeName, eventName).should('exist');
          notificationsObj.tenantNotificationTypeEventSmsIconBadge(typeName, eventName).should('not.exist');
          break;
        case 'email template indicator with warning':
          notificationsObj.tenantNotificationTypeEventMailBadge(typeName, eventName).should('exist');
          notificationsObj.tenantNotificationTypeEventMailIcon(typeName, eventName).should('exist');
          break;
        case 'bot template indicator with warning':
          notificationsObj.tenantNotificationTypeEventBotIconBadge(typeName, eventName).should('exist');
          notificationsObj.tenantNotificationTypeEventBotIcon(typeName, eventName).should('exist');
          break;
        case 'sms template indicator with warning':
          notificationsObj.tenantNotificationTypeEventSmsIconBadge(typeName, eventName).should('exist');
          notificationsObj.tenantNotificationTypeEventSmsIcon(typeName, eventName).should('exist');
          break;
        default:
          expect(elementType).to.be.oneOf([
            'email template indicator',
            'bot template indicator',
            'sms template indicator',
            'email template indicator with warning',
            'bot template indicator with warning',
            'sms template indicator with warning',
          ]);
      }
    } else if (viewOrNot == 'should not view') {
      switch (elementType) {
        case 'bot template indicator':
          notificationsObj.tenantNotificationTypeEventBotIcon(typeName, eventName).should('not.exist');
          break;
        case 'sms template indicator':
          notificationsObj.tenantNotificationTypeEventSmsIcon(typeName, eventName).should('not.exist');
          break;
        case 'email template indicator with warning':
          notificationsObj.tenantNotificationTypeEventMailBadge(typeName, eventName).should('not.exist');
          break;
        case 'bot template indicator with warning':
          notificationsObj.tenantNotificationTypeEventBotIconBadge(typeName, eventName).should('not.exist');
          break;
        case 'sms template indicator with warning':
          notificationsObj.tenantNotificationTypeEventSmsIconBadge(typeName, eventName).should('not.exist');
          break;
        default:
          expect(elementType).to.be.oneOf([
            'bot template indicator',
            'sms template indicator',
            'email template indicator with warning',
            'bot template indicator with warning',
            'sms template indicator with warning',
          ]);
      }
    } else {
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

Then('the user views that email channel is greyed out', function () {
  notificationsObj.notificationChannelEmailCheckbox().shadow().find('input').should('be.disabled');
  notificationsObj.notificationChannelEmailCheckbox().shadow().find('input').should('be.checked');
});

When('the user selects {string} tab on the event template', function (tab) {
  notificationsObj.notificationEventTemplateTab(tab).click();
  cy.wait(1000);
});

When(
  'the user enters {string} as subject and {string} as body on {string} template page',
  function (subjectText: string, bodyText: string, channel: string) {
    cy.wait(2000); // Wait for the template editor elements to show
    // Use proper casing no matter what cases used by the passed in parameter
    let channelNameInTitle;
    switch (channel.toLowerCase()) {
      case 'email':
        channelNameInTitle = 'email';
        break;
      case 'sms':
        channelNameInTitle = 'SMS';
        break;
      case 'bot':
        channelNameInTitle = 'bot';
        break;
      default:
        expect(channel.toLowerCase()).to.be.oneOf(['email', 'sms', 'bot']);
    }
    notificationsObj
      .eventTemplateModalSubject(channelNameInTitle)
      .click({ force: true })
      .focus()
      .clear({ force: true })
      .type('{selectAll}', { force: true, parseSpecialCharSequences: true }) //In case clear doesn't work, do select all and then type in text
      .type(subjectText, { force: true, parseSpecialCharSequences: false });

    notificationsObj
      .eventTemplateModalBody(channelNameInTitle)
      .click({ force: true })
      .focus()
      .clear({ force: true })
      .type('{selectAll}', { force: true, parseSpecialCharSequences: true }) //In case clear doesn't work, do select all and then type in text
      .type(bodyText, { force: true, parseSpecialCharSequences: false });
  }
);

Then('the user views an email template modal title for {string}', function (notificationEvent) {
  notificationsObj.editTemplateModalTitle().invoke('text').should('contain', notificationEvent);
});

Then('the user views the email subject {string}', function (subject) {
  notificationsObj.editTemplateModalEmailSubject().invoke('text').should('contain', subject);
  notificationsObj.templateModalPreviewPaneEmailSubject().invoke('text').should('contain', subject);
});

Then('the user views the email body {string}', function (emailBody) {
  notificationsObj.editTemplateModalEmailBody().invoke('text').should('contain', emailBody);
  cy.wait(2000); // Wait 2 second for iFrame to show to avoid undefined element error
  notificationsObj.templateModalPreviewPaneEmailBody().then(function ($iFrame) {
    const iFrameContent = $iFrame.contents().find('body');
    cy.wrap(iFrameContent).find('[class*="email-content"]').invoke('text').should('contain', emailBody);
  });
});

When('the user clicks Close button in event template modal', function () {
  cy.scrollTo('bottom');
  notificationsObj.editTemplateModalCloseBtn().shadow().find('button').click({ force: true });
});

When('the user views the link for managing email subscription', function () {
  notificationsObj
    .templateModalPreviewPaneEmailBody()
    .its('0.contentDocument.body')
    .find('footer')
    .contains('Please do not reply to this email. Manage your subscription here.');

  const urlSubscriptionLogin = Cypress.env('subscriptionAppUrl') + '/' + Cypress.env('tenantName') + '/login';
  cy.log(urlSubscriptionLogin);
  notificationsObj
    .templateModalPreviewPaneEmailBody()
    .its('0.contentDocument.body')
    .find('footer')
    .find('[class="goa-footer-event"]')
    .find('a[href]')
    .invoke('attr', 'href')
    .should('contain', urlSubscriptionLogin);
});

When('the user clicks Save all button in template modal', function () {
  cy.wait(2000);
  notificationsObj.editTemplateModalSaveallBtn().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then('the user {string} Reset button for {string} in {string}', function (viewOrNot, eventName, typeName) {
  switch (viewOrNot) {
    case 'views':
      notificationsObj.notificationTypeEventResetBtn(typeName, eventName).should('exist');
      break;
    case 'should not view':
      notificationsObj.notificationTypeEventResetBtn(typeName, eventName).should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

Then('the user views Reset email template modal', function () {
  notificationsObj.resetEmailTemplateModalTitle().invoke('text').should('contains', 'Reset email template');
});

When('the user clicks Delete button in Reset email template modal', function () {
  notificationsObj.resetEmailTemplateModalDeleteBtn().shadow().find('button').click({ force: true });
  cy.wait(2000); // Wait for the modal and reset button to go away
});

When('the user clicks eye icon of {string}, {string} under {string}', function (addressAs, email, notificationType) {
  cy.wait(2000); // Wait for eye icon to show
  notificationsObj
    .notificationRecordEyeIcon(notificationType, addressAs, email)
    .shadow()
    .find('button')
    .click({ force: true });
  cy.wait(1000);
  notificationsObj
    .notificationRecordEyeIcon(notificationType, addressAs, email)
    .invoke('attr', 'icon')
    .should('eq', 'eye-off');
});

Then('the user views the details of {string}, {string} under {string}', function (addressAs, email, notificationType) {
  notificationsObj
    .notificationRecordDetailsCriteria(notificationType, addressAs, email)
    .invoke('text')
    .should('contains', 'correlationId');
  notificationsObj
    .notificationRecordDetailsCriteria(notificationType, addressAs, email)
    .invoke('text')
    .should('contains', 'context');
});

Then('the user views the email template preview of {string} as subject and {string} as body', function (subject, body) {
  notificationsObj.templateModalPreviewPaneEmailSubject().invoke('text').should('contain', subject);
  cy.wait(2000); // Wait 2 second for preview to show
  notificationsObj.templateModalPreviewPaneEmailBody().then(function ($iFrame) {
    const iFrameContent = $iFrame.contents().find('body');
    cy.wrap(iFrameContent).find('[class*="email-content"]').invoke('text').should('contain', body);
  });
});

Then(
  'the user views the SMS template preview of {string} as subject and {string} as body',
  function (subject: string, body: string) {
    cy.wait(2000); // Wait 2 second for preview to show
    const subjectWithoutVariables = subject.replace(/{{.+?}}/, '');
    const bodyWithoutVariables = body.replace(/{{.+?}}/, '');
    notificationsObj.templateModalPreviewPaneSMSSubject().invoke('text').should('not.contain', '{'); // {{variable}} should be replaced with random text
    notificationsObj.templateModalPreviewPaneSMSSubject().invoke('text').should('contain', subjectWithoutVariables);
    notificationsObj.templateModalPreviewPaneSMSBody().invoke('text').should('not.contain', '{'); // {{variable}} should be replaced with random text
    notificationsObj.templateModalPreviewPaneSMSBody().invoke('text').should('contain', bodyWithoutVariables);
  }
);

Then(
  'the user views the Bot template preview of {string} as subject and {string} as body',
  function (subject: string, body: string) {
    cy.wait(2000); // Wait 2 second for preview to show
    const subjectWithoutVariables = subject.replace(/{{.+?}}/, '');
    const bodyWithoutVariables = body.replace(/{{.+?}}/, '');
    notificationsObj.templateModalPreviewPaneBotSubject().invoke('text').should('not.contain', '{'); // {{variable}} should be replaced with random text
    notificationsObj.templateModalPreviewPaneBotSubject().invoke('text').should('contain', subjectWithoutVariables);
    notificationsObj.templateModalPreviewPaneBotBody().invoke('text').should('not.contain', '{'); // {{variable}} should be replaced with random text
    notificationsObj.templateModalPreviewPaneBotBody().invoke('text').should('contain', bodyWithoutVariables);
  }
);

Then('Event template modal is closed', function () {
  notificationsObj.eventTemplateModal().should('not.exist');
});

Then('the user views the hint text for GoA wrapper in event template modal', function () {
  notificationsObj
    .templateModalBodyWithHelpText()
    .invoke('attr', 'helptext')
    .should(
      'contain',
      "*GOA default header and footer wrapper is applied if the template doesn't include proper <html> opening and closing tags"
    );
});

Then('the user {string} GoA header and footer in the email preview', function (viewOrNot) {
  cy.wait(2000); // Wait 2 second for preview to show
  switch (viewOrNot) {
    case 'views':
      notificationsObj.templateModalPreviewPaneEmailBody().then(function ($iFrame) {
        const iFrameContent = $iFrame.contents().find('body');
        cy.wrap(iFrameContent).find('[class*="goa-header-event-template"]').should('exist');
        cy.wrap(iFrameContent).find('[class*="goa-footer-event"]').should('exist');
      });
      break;
    case 'should not view':
      notificationsObj.templateModalPreviewPaneEmailBody().then(function ($iFrame) {
        const iFrameContent = $iFrame.contents().find('body');
        cy.wrap(iFrameContent).find('[class*="goa-header-event-template"]').should('not.exist');
        cy.wrap(iFrameContent).find('[class*="goa-footer-event"]').should('not.exist');
      });
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

Then(
  'the user should be able to view {string}, {string} and {string} as contact information in the subscription app',
  function (email: string, phone: string, instructions: string) {
    // Visit notification page of the realm
    cy.visit(Cypress.env('subscriptionAppUrl') + '/' + Cypress.env('realm') + '/login?kc_idp_hint=');
    cy.wait(4000); // Wait all the redirects to settle down

    // Verify the support info
    const editedEmail = email.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (!editedEmail) {
      notificationsObj.subscriptionAppContactSupportEmail().invoke('text').should('contain', email);
    } else {
      notificationsObj.subscriptionAppContactSupportEmail().invoke('text').should('contain', emailInput);
    }
    const editedPhone = phone.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (!editedPhone) {
      notificationsObj
        .subscriptionAppContactSupportPhone()
        .invoke('text')
        .then(($text) => {
          const phoneNumber = $text
            .replace(/([^0-9])+/, '')
            .replace(' ', '')
            .replace(' ', '');
          cy.wrap(phoneNumber).should('contain', phoneInput);
        });
    } else {
      notificationsObj
        .subscriptionAppContactSupportPhone()
        .invoke('text')
        .then(($text) => {
          const phoneNumber = $text
            .replace(/([^0-9])+/, '')
            .replace(' ', '')
            .replace(' ', '');
          cy.wrap(phoneNumber).should('contain', phoneInput);
        });
    }
    const editedInstructions = instructions.match(/(?<=rnd{)[^{}]+(?=})/g);
    if (!editedInstructions) {
      notificationsObj.subscriptionAppContactSupportsInstructions().invoke('text').should('contain', instructions);
    } else {
      notificationsObj.subscriptionAppContactSupportsInstructions().invoke('text').should('contain', instructionsInput);
    }
  }
);

When('the user clicks Edit button for email information', function () {
  notificationsObj.notificationOverviewEmailInformationEditIcon().shadow().find('button').click({ force: true });
});

Then('the user {string} Edit email information modal', function (viewOrNot) {
  switch (viewOrNot) {
    case 'views':
      notificationsObj.notificationOverviewEmailInformationModal().should('exist');
      break;
    case 'should not view':
      notificationsObj.notificationOverviewEmailInformationModal().should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

Then('the user views help content of {string}', function (helpText) {
  notificationsObj
    .notificationOverviewEmailInformationModalEmailFormItem()
    .invoke('attr', 'helptext')
    .should('contains', helpText);
});

When('the user enters {string} in the email field in Edit email information modal', function (email: string) {
  notificationsObj
    .notificationOverviewEmailInformationModalEmailField()
    .shadow()
    .find('input')
    .clear()
    .type(email, { delay: 200, force: true });
});

When('clicks Save button in Edit email information modal', function () {
  notificationsObj.notificationOverviewEmailInformationModalSaveBtn().shadow().find('button').click({ force: true });
});

Then('the user views {string} in the Edit email information modal', function (errorMsg) {
  notificationsObj
    .notificationOverviewEmailInformationModalEmailFormItem()
    .shadow()
    .find('.error-msg')
    .invoke('text')
    .should('contain', errorMsg);
});

When('the user clicks Cancel button in the Edit email information modal', function () {
  notificationsObj.notificationOverviewEmailInformationModalCancelBtn().shadow().find('button').click({ force: true });
});

Then('the user {string} the email address of {string} under From email', function (viewOrNot, email) {
  switch (viewOrNot) {
    case 'views':
      notificationsObj.notificationOverviewEmailInformationFromEmail().invoke('text').should('contain', email);
      break;
    case 'should not view':
      notificationsObj.notificationOverviewEmailInformationFromEmail().invoke('text').should('not.contain', email);
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});
