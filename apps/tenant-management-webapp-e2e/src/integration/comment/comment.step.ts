import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import CommentPage from './comment.page';
import common from '../common/common.page';

const commonObj = new common();
const commentObj = new CommentPage();

Given('a tenant admin user is on comment service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Comment', 4000);
});

When('the user clicks Add topic type button on comment service overview page', function () {
  commonObj.activeTab().should('have.text', 'Overview');
  commentObj.addTopicTypeBtn().shadow().find('button').click({ force: true });
});

Then('the user views Add topic type modal', function () {
  commentObj.addTopicTypeModalTitle().invoke('text').should('eq', 'Add topic type');
});

When('the user clicks Cancel button in Add topic type modal', function () {
  commentObj.addTopicTypeModalCancelButton().shadow().find('button').click({ force: true });
});

Then('the user views topic types page', function () {
  commentObj.topicTypesTable().should('be.visible');
});

When('the user clicks Add topic type button on topic types page', function () {
  commonObj.activeTab().should('have.text', 'Topic types');
  commentObj.addTopicTypeBtn().shadow().find('button').click({ force: true });
});

When('the user enters {string} in Add topic type modal', function (name) {
  commentObj.addTopicTypeNameTextField().shadow().find('input').clear().type(name, { force: true, delay: 200 });
});

Then('the user views the error message of {string} for Name field in Add topic type modal', function (errorMsg) {
  commentObj.nameFormItem().shadow().find('.error-msg').invoke('text').should('contain', errorMsg);
});

When('the user clicks Save button in Add topic type modal', function () {
  commentObj.addTopicTypeModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views topic type editor for {string}', function (name) {
  cy.viewport(1920, 1080);
  cy.wait(1000);
  commentObj.editorTopicTypeNameValue().should('have.text', name);
});

When(
  'the user enters {string} as admin roles, {string} as commenter roles, {string} as reader roles',
  function (adminRole, commenterRole, readerRole) {
    //Unselect all checkboxes
    //Looks like checkboxes can't handle fast clicking to uncheck multiple checkboxes and seems only the last checked checkboxes are unchecked.
    //Didn't find a way to add a delay between clicks. Use 5 loops to make sure missed checked checkboxes are unchecked.
    for (let j = 0; j < 5; j++) {
      cy.wait(500);
      commentObj
        .editorCheckboxesTables()
        .shadow()
        .find('goa-checkbox')
        .shadow()
        .find('.goa-checkbox-container')
        .then((elements) => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute('class')?.includes('--selected')) {
              elements[i].click();
            }
          }
        });
    }

    //Select admin roles
    if (adminRole.toLowerCase() != 'empty') {
      const adminRoles = adminRole.split(',');
      for (let i = 0; i < adminRoles.length; i++) {
        if (adminRoles[i].includes(':')) {
          const adminClientRoleStringArray = adminRoles[i].split(':');
          let clientName = '';
          for (let j = 0; j < adminClientRoleStringArray.length - 1; j++) {
            if (j !== adminClientRoleStringArray.length - 2) {
              clientName = clientName + adminClientRoleStringArray[j].trim() + ':';
            } else {
              clientName = clientName + adminClientRoleStringArray[j];
            }
          }
          const adminRoleName = adminClientRoleStringArray[adminClientRoleStringArray.length - 1];
          commentObj
            .editorClientRolesTable(clientName)
            .shadow()
            .find('.role-name')
            .contains(adminRoleName)
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        } else {
          commentObj
            .editorRolesTable()
            .shadow()
            .find('.role-name')
            .contains(adminRoles[i].trim())
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        }
      }
    }

    //Select commenter roles
    if (commenterRole.toLowerCase() != 'empty') {
      const commenterRoles = commenterRole.split(',');
      for (let i = 0; i < commenterRoles.length; i++) {
        if (commenterRoles[i].includes(':')) {
          const commenterClientRoleStringArray = commenterRoles[i].split(':');
          let clientName = '';
          for (let j = 0; j < commenterClientRoleStringArray.length - 1; j++) {
            if (j !== commenterClientRoleStringArray.length - 2) {
              clientName = clientName + commenterClientRoleStringArray[j].trim() + ':';
            } else {
              clientName = clientName + commenterClientRoleStringArray[j];
            }
          }
          const commenterRoleName = commenterClientRoleStringArray[commenterClientRoleStringArray.length - 1];
          commentObj
            .editorClientRolesTable(clientName)
            .shadow()
            .find('.role-name')
            .contains(commenterRoleName)
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        } else {
          commentObj
            .editorRolesTable()
            .shadow()
            .find('.role-name')
            .contains(commenterRoles[i].trim())
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        }
      }
    }

    //Select reader roles
    if (readerRole.toLowerCase() != 'empty') {
      const readerRoles = readerRole.split(',');
      for (let i = 0; i < readerRoles.length; i++) {
        if (readerRoles[i].includes(':')) {
          const readerClientRoleStringArray = readerRoles[i].split(':');
          let clientName = '';
          for (let j = 0; j < readerClientRoleStringArray.length - 1; j++) {
            if (j !== readerClientRoleStringArray.length - 2) {
              clientName = clientName + readerClientRoleStringArray[j].trim() + ':';
            } else {
              clientName = clientName + readerClientRoleStringArray[j];
            }
          }
          const readerRoleName = readerClientRoleStringArray[readerClientRoleStringArray.length - 1];
          commentObj
            .editorClientRolesTable(clientName)
            .shadow()
            .find('.role-name')
            .contains(readerRoleName)
            .next()
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        } else {
          commentObj
            .editorRolesTable()
            .shadow()
            .find('.role-name')
            .contains(readerRoles[i].trim())
            .next()
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        }
      }
    }
  }
);

Then('the user clicks Save button on topic type editor', function () {
  commentObj.editorSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then(
  'the user {string} the topic type of {string}, {string}, {string}, {string}',
  function (action, name, adminRole, commenterRole, readerRole) {
    cy.wait(1000); //Wait for the grid to load all data
    findTopicType(name, adminRole, commenterRole, readerRole).then((rowNumber) => {
      switch (action) {
        case 'views':
          expect(rowNumber).to.be.greaterThan(
            0,
            'Topic type of ' +
              name +
              ', ' +
              adminRole +
              ', ' +
              commenterRole +
              ', ' +
              readerRole +
              ' has row #' +
              rowNumber
          );
          break;
        case 'should not view':
          expect(rowNumber).to.equal(
            0,
            'Topic type of ' +
              name +
              ', ' +
              adminRole +
              ', ' +
              commenterRole +
              ', ' +
              readerRole +
              ' has row #' +
              rowNumber
          );
          break;
        default:
          expect(action).to.be.oneOf(['views', 'should not view']);
      }
    });
  }
);

//Find topic type with name, admin role(s), commenter role(s), reader role(s)
//Input: name, admin role(s) & commenter role(s) & reader role(s) in a string separated with comma
//Return: row number if the topic type is found; zero if the item isn't found
function findTopicType(name, adminRole, commenterRole, readerRole) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      let targetedNumber = 1;
      const adminRoles = adminRole.split(',');
      const commenterRoles = commenterRole.split(',');
      const readerRoles = readerRole.split(',');
      if (adminRole.toLowerCase() != 'empty') {
        targetedNumber = targetedNumber + adminRoles.length;
      }
      if (commenterRole.toLowerCase() != 'empty') {
        targetedNumber = targetedNumber + commenterRoles.length;
      }
      if (readerRole.toLowerCase() != 'empty') {
        targetedNumber = targetedNumber + readerRoles.length;
      }
      commentObj
        .topicTypesTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the namespace cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(name)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[2].innerHTML); // Print out the assigner role cell innerHTML for debug purpose
            adminRoles.forEach((aRole) => {
              if (rowElement.cells[2].innerHTML.includes(aRole.trim())) {
                counter = counter + 1;
              }
            });
            // cy.log(rowElement.cells[3].innerHTML); // Print out the worker role cell innerHTML for debug purpose
            commenterRoles.forEach((cRole) => {
              if (rowElement.cells[3].innerHTML.includes(cRole.trim())) {
                counter = counter + 1;
              }
            });
            // cy.log(rowElement.cells[4].innerHTML); // Print out the worker role cell innerHTML for debug purpose
            readerRoles.forEach((rRole) => {
              if (rowElement.cells[4].innerHTML.includes(rRole.trim())) {
                counter = counter + 1;
              }
            });
            Cypress.log({
              name: 'Number of matched items for row# ' + rowElement.rowIndex + ': ',
              message: String(String(counter)),
            });
            if (counter == targetedNumber) {
              rowNumber = rowElement.rowIndex;
            }
          });
          Cypress.log({
            name: 'Row number for the found item: ',
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
  'the user clicks {string} button for the topic type of {string}, {string}, {string}, {string}',
  function (button, name, adminRole, commenterRole, readerRol) {
    findTopicType(name, adminRole, commenterRole, readerRol).then((rowNumber) => {
      switch (button) {
        case 'Edit':
          commentObj.topicTypeEditButton(rowNumber).shadow().find('button').click({ force: true });
          cy.wait(2000);
          break;
        case 'Delete':
          commentObj.topicTypeDeleteButton(rowNumber).shadow().find('button').click({ force: true });
          cy.wait(2000);
          break;
        default:
          expect(button).to.be.oneOf(['Edit', 'Delete']);
      }
    });
  }
);

When('the user clicks Back button on topic type editor', function () {
  commentObj.editorBackButton().shadow().find('button').click({ force: true });
});
