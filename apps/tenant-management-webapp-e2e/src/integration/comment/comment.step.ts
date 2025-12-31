import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import commonlib from '../common/common-library';
import CommentPage from './comment.page';
import common from '../common/common.page';

const commonObj = new common();
const commentObj = new CommentPage();

let replacementString;

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
  cy.wait(1000);
});

Then('the user views topic types page', function () {
  commentObj.topicTypesTable().should('be.visible');
});

When('the user clicks Add topic type button on topic types page', function () {
  commonObj.activeTab().should('have.text', 'Topic types');
  commentObj.addTopicTypeBtn().shadow().find('button').click({ force: true });
});

When('the user enters {string} in Add topic type modal', function (name: string) {
  const currentTime = new Date();
  replacementString =
    '-' +
    ('0' + currentTime.getMonth()).substr(-2) +
    ('0' + currentTime.getDate()).substr(-2) +
    ('0' + currentTime.getHours()).substr(-2) +
    ('0' + currentTime.getHours()).substr(-2) +
    ('0' + currentTime.getSeconds()).substr(-2);
  const nameAfterReplacement = commonlib.stringReplacement(name, replacementString);
  commentObj
    .addTopicTypeNameTextField()
    .shadow()
    .find('input')
    .clear()
    .type(nameAfterReplacement, { force: true, delay: 200 });
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
  cy.wait(4000);
  const nameAfterReplacement = commonlib.stringReplacement(name, replacementString);
  commentObj.editorTopicTypeNameValue().should('contain.text', nameAfterReplacement);
});

Then(
  'the user views {string} as default selection for security classification',
  function (defaultClassification: string) {
    commentObj.editorClassificationDropdown().invoke('attr', 'value').should('eq', defaultClassification.toLowerCase());
  }
);

Then('the user views {string} in Select a security classification dropdown', function (dropdownOptions: string) {
  const options = dropdownOptions.split(',');
  commentObj.editorClassificationDropdownItems().then((elements) => {
    expect(elements.length).to.eq(options.length);
    for (let i = 0; i < options.length; i++) {
      expect(elements[i].getAttribute('value')).to.contain(options[i].trim().toLowerCase());
    }
  });
});

When(
  'the user enters {string} as classification, {string} as admin roles, {string} as commenter roles, {string} as reader roles',
  function (classification: string, adminRole: string, commenterRole: string, readerRole: string) {
    cy.wait(1000); // Test failed occassionally due to not finding the classification dropdown. Added a second wait.
    if (classification !== 'skip') {
      commentObj
        .editorClassificationDropdown()
        .invoke('attr', 'value')
        .then((classificationValue) => {
          if (classificationValue !== classification.toLowerCase()) {
            commentObj.editorClassificationDropdown().shadow().find('input').click({ force: true });
            commentObj
              .editorClassificationDropdown()
              .shadow()
              .find('li')
              .contains(classification)
              .click({ force: true });
          }
        });
    }

    //Unselect all checkboxes
    //Looks like checkboxes can't handle fast clicking to uncheck multiple checkboxes and seems only the last checked checkboxes are unchecked.
    //Didn't find a way to add a delay between clicks. Use 5 loops to make sure missed checked checkboxes are unchecked.
    for (let j = 0; j < 5; j++) {
      cy.wait(500);
      commentObj
        .editorCheckboxesTables()
        .find('goa-checkbox')
        .shadow()
        .find('[class^="container"]')
        .then((elements) => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute('class')?.includes('selected')) {
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
            .find('.role-name')
            .contains(adminRoleName)
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('[class^="container"]')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        } else {
          commentObj
            .editorRolesTable()
            .find('.role-name')
            .contains(adminRoles[i].trim())
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('[class^="container"]')
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
            .find('.role-name')
            .contains(commenterRoleName)
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('[class^="container"]')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        } else {
          commentObj
            .editorRolesTable()
            .find('.role-name')
            .contains(commenterRoles[i].trim())
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('[class^="container"]')
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
            .find('.role-name')
            .contains(readerRoleName)
            .next()
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('[class^="container"]')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        } else {
          commentObj
            .editorRolesTable()
            .find('.role-name')
            .contains(readerRoles[i].trim())
            .next()
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('[class^="container"]')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        }
      }
    }
  }
);

Then('the user clicks Save button in topic type editor', function () {
  commentObj.editorSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user {string} the topic type of {string}, {string}', function (action, name, classification) {
  cy.wait(1000); //Wait for the grid to load all data
  const nameAfterReplacement = commonlib.stringReplacement(name, replacementString);
  findTopicType(nameAfterReplacement, classification).then((rowNumber) => {
    switch (action) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(
          0,
          'Topic type of ' + name + ', ' + classification + ' has row #' + rowNumber
        );
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Topic type of ' + name + ', ' + classification + ' has row #' + rowNumber);
        break;
      default:
        expect(action).to.be.oneOf(['views', 'should not view']);
    }
  });
});

//Find topic type with name, classification
//Input: name, classificationin a string separated with comma
//Return: row number if the topic type is found; zero if the item isn't found
function findTopicType(name, classification) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      let targetedNumber = 1;
      if (classification.toLowerCase() != 'empty') {
        targetedNumber = targetedNumber + 1;
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
            // cy.log(rowElement.cells[2].innerHTML); // Print out the worker role cell innerHTML for debug purpose
            if (rowElement.cells[2].innerHTML.includes(classification.toLowerCase())) {
              counter = counter + 1;
            }
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
  'the user clicks {string} button for the topic type of {string}, {string}',
  function (button, name, classification) {
    const nameAfterReplacement = commonlib.stringReplacement(name, replacementString);
    findTopicType(nameAfterReplacement, classification).then((rowNumber) => {
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

Then('the user views delete topic type confirmation modal for {string}', function (topicTypeName) {
  topicTypeName = commonlib.stringReplacement(topicTypeName, replacementString);
  commentObj.deleteTopicTypeModalHeading().invoke('text').should('eq', 'Delete topic type');
  commentObj.deleteTopicTypeModalContentTopicName().invoke('text').should('contain', topicTypeName);
});

When('the user clicks Back button in topic type editor', function () {
  commentObj.editorBackButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks Edit button in topic type editor', function () {
  commentObj.topicTypeEditorEditButton().click();
  cy.wait(2000);
});

Then('the user views Edit topic type modal in topic type editor', function () {
  commentObj.topicTypeEditorEditTopicTypeModal().should('exist');
  commentObj.topicTypeEditorEditTopicTypeModalTitle().should('contain.text', 'Edit topic type');
});

When('the user enters {string} in Edit topic type modal', function (name: string) {
  const nameAfterReplacement = commonlib.stringReplacement(name, replacementString);
  commentObj
    .topicTypeEditorEditTopicTypeModalNameInput()
    .shadow()
    .find('input')
    .clear()
    .type(nameAfterReplacement, { force: true, delay: 200 });
});

When('the user clicks Save button in Edit topic type modal', function () {
  commentObj
    .topicTypeEditorEditTopicTypeModalSaveButton()
    .shadow()
    .find('button')
    .scrollIntoView()
    .click({ force: true });
  cy.wait(2000);
});

Then(
  'the user views {string} as classification, {string} as admin roles, {string} as commenter roles, {string} as reader roles',
  function (dataClass: string, adminRole: string, commenterRole: string, readerRole: string) {
    //check data classification
    commentObj.editorClassificationDropdown().invoke('attr', 'value').should('eq', dataClass.toLowerCase());

    //check admin roles
    let adminRoleMatchCount = 0;
    if (adminRole.toLowerCase() != 'empty') {
      const adminRoles = adminRole.split(',');
      commentObj
        .topicTypeEditorRolesTables()
        .find('goa-checkbox[testid*="Admin roles"]')
        .then((appRoles) => {
          for (let i = 0; i < appRoles.length; i++) {
            if (appRoles[i].getAttribute('checked') == 'true') {
              for (let j = 0; j < adminRoles.length; j++) {
                if (appRoles[i].getAttribute('name')?.includes(adminRoles[j])) {
                  const appRoleName = appRoles[i].getAttribute('name');
                  if (appRoleName != null) {
                    cy.log(appRoleName);
                  } else {
                    cy.log('Application role name attribute is null');
                  }
                  adminRoleMatchCount = adminRoleMatchCount + 1;
                }
              }
            }
          }
          expect(adminRoles.length).to.eq(adminRoleMatchCount);
        });
    } else {
      commentObj
        .topicTypeEditorRolesTables()
        .find('goa-checkbox[testid*="Admin roles"]')
        .then((appRoles) => {
          for (let i = 0; i < appRoles.length; i++) {
            if (appRoles[i].getAttribute('checked') == 'true') {
              expect(appRoles[i].getAttribute('checked')).to.be('false');
            }
          }
        });
      cy.log('No admin role is selected');
    }

    //check commenter roles
    let commenterRoleMatchCount = 0;
    if (commenterRole.toLowerCase() != 'empty') {
      const commenterRoles = commenterRole.split(',');
      commentObj
        .topicTypeEditorRolesTables()
        .find('goa-checkbox[testid*="Commenter roles"]')
        .then((appRoles) => {
          for (let i = 0; i < appRoles.length; i++) {
            if (appRoles[i].getAttribute('checked') == 'true') {
              for (let j = 0; j < commenterRoles.length; j++) {
                if (appRoles[i].getAttribute('name')?.includes(commenterRoles[j])) {
                  const appRoleName = appRoles[i].getAttribute('name');
                  if (appRoleName != null) {
                    cy.log(appRoleName);
                  } else {
                    cy.log('Application role name attribute is null');
                  }
                  commenterRoleMatchCount = commenterRoleMatchCount + 1;
                }
              }
            }
          }
          expect(commenterRoles.length).to.eq(commenterRoleMatchCount);
        });
    } else {
      commentObj
        .topicTypeEditorRolesTables()
        .find('goa-checkbox[testid*="Commenter roles"]')
        .then((appRoles) => {
          for (let i = 0; i < appRoles.length; i++) {
            if (appRoles[i].getAttribute('checked') == 'true') {
              expect(appRoles[i].getAttribute('checked')).to.be('false');
            }
          }
        });
      cy.log('No commenter role is selected');
    }

    //check reader roles
    let readerRoleMatchCount = 0;
    if (readerRole.toLowerCase() != 'empty') {
      const readerRoles = readerRole.split(',');
      commentObj
        .topicTypeEditorRolesTables()
        .find('goa-checkbox[testid*="Reader roles"]')
        .then((appRoles) => {
          for (let i = 0; i < appRoles.length; i++) {
            if (appRoles[i].getAttribute('checked') == 'true') {
              for (let j = 0; j < readerRoles.length; j++) {
                if (appRoles[i].getAttribute('name')?.includes(readerRoles[j])) {
                  const appRoleName = appRoles[i].getAttribute('name');
                  if (appRoleName != null) {
                    cy.log(appRoleName);
                  } else {
                    cy.log('Application role name attribute is null');
                  }
                  readerRoleMatchCount = readerRoleMatchCount + 1;
                }
              }
            }
          }
          expect(readerRoles.length).to.eq(readerRoleMatchCount);
        });
    } else {
      commentObj
        .topicTypeEditorRolesTables()
        .find('goa-checkbox[testid*="Reader roles"]')
        .then((appRoles) => {
          for (let i = 0; i < appRoles.length; i++) {
            if (appRoles[i].getAttribute('checked') == 'true') {
              expect(appRoles[i].getAttribute('checked')).to.be('false');
            }
          }
        });
      cy.log('No reader role is selected');
    }
  }
);

When('the user selects {string} in Select a topic type dropdown', function (dropdownItemName: string) {
  commentObj.selectTopicTypeDropdown().shadow().find('input').click({ force: true });
  commentObj.selectTopicTypeDropdown().shadow().find('li').contains(dropdownItemName).click({ force: true });
  cy.wait(2000);
});

Then('the user views a topic list', function () {
  commentObj.topicTable().should('be.visible');
});

When('the user clicks Add topic type button on comments page', function () {
  commentObj.addTopicButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Add topic modal', function () {
  commentObj.addTopicModalHeading().invoke('text').should('eq', 'Add topic');
});

When(
  'the user enters {string}, {string}, {string} in Add topic modal',
  function (topicName: string, topicDesc: string, topicResourceId: string) {
    const currentTime = new Date();
    replacementString =
      '-' +
      ('0' + currentTime.getMonth()).substr(-2) +
      ('0' + currentTime.getDate()).substr(-2) +
      ('0' + currentTime.getHours()).substr(-2) +
      ('0' + currentTime.getHours()).substr(-2) +
      ('0' + currentTime.getSeconds()).substr(-2);
    const topicNameAfterReplacement = commonlib.stringReplacement(topicName, replacementString);
    commentObj
      .addTopicModalName()
      .shadow()
      .find('input')
      .clear()
      .type(topicNameAfterReplacement, { force: true, delay: 200 });
    commentObj.addTopicModalDesc().shadow().find('textarea').clear().type(topicDesc, { force: true, delay: 100 });
    commentObj
      .addTopicModalResourceId()
      .shadow()
      .find('input')
      .clear()
      .type(topicResourceId, { force: true, delay: 100 });
  }
);

When('the user clicks {string} button in Add topic modal', function (button: string) {
  switch (button.toLowerCase()) {
    case 'save':
      commentObj.addTopicModalSaveBtn().should('not.be.disabled').click({ force: true });
      cy.wait(4000);
      break;
    case 'cancel':
      commentObj.addTopicModalCancelBtn().click({ force: true });
      cy.wait(2000);
      break;
    default:
      expect(button).to.be.oneOf(['save', 'cancel']);
  }
});

When('the user clicks Load more button for topic list', function () {
  commentObj.topicLoadMoreButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views more than 10 topics', function () {
  commentObj.topicTableRows().should('have.length.above', 10);
});

Then('the user {string} a topic of {string}, {string}', function (viewOrNot, name, resourceId) {
  // Click Load More button 3 times if it's there
  for (let i = 0; i < 3; i++) {
    commentObj.commentsTab().then((parentElement) => {
      if (parentElement.find('goa-button:contains("Load more")').length > 0) {
        commentObj.topicLoadMoreButton().shadow().find('button').click({ force: true });
        cy.wait(2000);
      }
    });
  }

  name = commonlib.stringReplacement(name, replacementString);

  findTopic(name, resourceId).then((rowNumber) => {
    switch (viewOrNot) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(0, 'Topic of ' + name + ', ' + resourceId + ' has row #' + rowNumber);
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Topic of ' + name + ', ' + resourceId + ', ' + ' has row #' + rowNumber);
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  });
});

//Find a topic with name, resource id
//Input: name, resource id
//Return: row number if a record is found; zero if record isn't found
function findTopic(name, id) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const targetedNumber = 2; // number of cells need to match to find the record
      commentObj
        .topicTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            if (rowElement.cells.length == 4) {
              // only check rows with 4 cells
              // cy.log(rowElement.cells[0].innerHTML); // Print out the name cell innerHTML for debug purpose
              if (rowElement.cells[1].innerHTML.includes(name)) {
                counter = counter + 1;
              }
              // cy.log(rowElement.cells[1].innerHTML); // Print out the description cell innerHTML for debug purpose
              if (rowElement.cells[2].innerHTML.includes(id)) {
                counter = counter + 1;
              }
              Cypress.log({
                name: 'Number of matched items for row# ' + rowElement.rowIndex + ': ',
                message: String(String(counter)),
              });
            }
            if (counter == targetedNumber) {
              rowNumber = rowElement.rowIndex;
            }
          });
          Cypress.log({
            name: 'Row number for the found record: ',
            message: String(rowNumber),
          });
          resolve(rowNumber);
        });
    } catch (error) {
      reject(error);
    }
  });
}

When('the user clicks {string} icon for the topic of {string}, {string}', function (iconName, name, resourceId) {
  // Click Load More button 3 times if it's there
  for (let i = 0; i < 3; i++) {
    commentObj.commentsTab().then((parentElement) => {
      if (parentElement.find('goa-button:contains("Load more")').length > 0) {
        commentObj.topicLoadMoreButton().shadow().find('button').click({ force: true });
        cy.wait(2000);
      }
    });
  }

  name = commonlib.stringReplacement(name, replacementString);

  findTopic(name, resourceId).then((rowNumber) => {
    switch (iconName) {
      case 'eye':
        commentObj.topicEyeIcon(rowNumber).shadow().find('button').click({ force: true });
        cy.wait(4000);
        break;
      case 'eye-off':
        commentObj.topicEyeOffIcon(rowNumber).shadow().find('button').click({ force: true });
        break;
      case 'delete':
        commentObj.topicDeleteIcon(rowNumber).shadow().find('button').click({ force: true });
        break;
      default:
        expect(iconName).to.be.oneOf(['eye', 'eye-off', 'delete']);
    }
  });
});

Then(
  'the user views the description of {string} for the topic of {string}, {string}',
  function (desc, name, resourceId) {
    name = commonlib.stringReplacement(name, replacementString);
    findTopic(name, resourceId).then((rowNumber) => {
      const topicDetailsRowNumber = (Number(rowNumber) + 1).toString();
      commentObj.topicDescription(topicDetailsRowNumber).should('contain', desc);
    });
  }
);

Then(
  'the user views the message of No comments found for the topic of {string}, {string}',
  function (name, resourceId) {
    name = commonlib.stringReplacement(name, replacementString);
    findTopic(name, resourceId).then((rowNumber) => {
      const topicDetailsRowNumber = (Number(rowNumber) + 1).toString();
      commentObj.topicDetailsNoCommentsFoundMessage(topicDetailsRowNumber).should('exist');
    });
  }
);

When('the user clicks Add comment button for the topic', function () {
  commentObj.addCommentButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views Add comment modal', function () {
  commentObj.addCommentModalHeading().invoke('text').should('eq', 'Add comment');
});

When('the user enters {string} as comment', function (comment: string) {
  commentObj
    .addCommentModalComment()
    .shadow()
    .find('textarea')
    .clear({ force: true })
    .type(comment, { force: true, delay: 200 });
});

When('the user clicks {string} button in Add comment modal', function (button: string) {
  switch (button.toLowerCase()) {
    case 'save':
      commentObj.addCommentModalSaveBtn().shadow().find('button').click({ force: true });
      cy.wait(2000);
      break;
    case 'cancel':
      commentObj.addCommentModalCancelBtn().shadow().find('button').click({ force: true });
      cy.wait(1000);
      break;
    default:
      expect(button).to.be.oneOf(['save', 'cancel']);
  }
});

Then('the user views {string} with user info and current timestamp', function (comment) {
  commentObj.commentContent(comment).should('exist');
  commentObj
    .commentUser(comment)
    .invoke('text')
    .then((user) => {
      expect(user).to.contain('Auto Test');
    });
  commentObj
    .commentDateTime(comment)
    .invoke('text')
    .then((dateTimeString) => {
      // verify that the comment date time is within the last 60 seconds
      const commentDateTimeStringArray = dateTimeString.split(',');
      const commentDate = commentDateTimeStringArray[0].trim();
      const commentTime = commentDateTimeStringArray[1].trim();
      const commentDateTime = new Date(commentDate + ', ' + commentTime);
      Cypress.log({
        name: 'Comment time : ',
        message: commentDateTime.toLocaleString(),
      });
      const nowDateTime = new Date();
      Cypress.log({
        name: 'Current time : ',
        message: nowDateTime.toLocaleString(),
      });
      const millisecondDifference = nowDateTime.getTime() - commentDateTime.getTime();
      expect(millisecondDifference).to.be.lt(90000); // Comment time is less than 60 seconds ago
    });
});

When('the user clicks {string} icon for the comment of {string}', function (iconName, comment) {
  findComment(comment).then((rowNumber) => {
    switch (iconName) {
      case 'edit':
        commentObj.commentEditIcon(rowNumber).shadow().find('button').click({ force: true });
        break;
      case 'delete':
        commentObj.commentDeleteIcon(rowNumber).shadow().find('button').click({ force: true });
        break;
      default:
        expect(iconName).to.be.oneOf(['edit', 'delete']);
    }
  });
});

//Find a comment with content
//Input: comment content
//Return: row number if a record is found; zero if record isn't found
function findComment(comment) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      commentObj
        .commentsListContents()
        .then((contents) => {
          for (let i = 0; i < contents.length; i++) {
            if (contents[i].innerHTML.includes(comment)) {
              rowNumber = i + 1;
              break;
            }
          }
        })
        .then(() => {
          Cypress.log({
            name: 'Row number for the found record: ',
            message: String(rowNumber),
          });
          resolve(rowNumber);
        });
    } catch (error) {
      reject(error);
    }
  });
}

Then('the user views Edit comment modal', function () {
  commentObj.editCommentModalHeading().invoke('text').should('eq', 'Edit comment');
});

When('the user enters {string} in Edit comment modal', function (content: string) {
  commentObj
    .editCommentModalComment()
    .shadow()
    .find('textarea')
    .clear({ force: true })
    .type(content, { force: true, delay: 200 });
});

When('the user clicks Save button in Edit comment modal', function () {
  commentObj.editCommentModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then('the user views {string} shows on top of {string}', function (content1, content2) {
  findComment(content1).then((rowNumber1) => {
    findComment(content2).then((rowNumber2) => {
      expect(Number(rowNumber1)).to.lt(Number(rowNumber2));
    });
  });
});

Then('the user views Delete comment modal for {string}', function (comment) {
  commentObj.deleteCommentModalHeading().invoke('text').should('eq', 'Delete comment');
  commentObj.deleteCommentModalContent().invoke('text').should('contain', comment);
});

When('the user clicks Delete button in Delete comment modal', function () {
  commentObj.deleteCommentModalDeleteBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user {string} the comment of {string}', function (viewOrNotView, comment) {
  switch (viewOrNotView) {
    case 'views':
      commentObj.commentContent(comment).should('exist');
      break;
    case 'should not view':
      commentObj.commentContent(comment).should('not.exist');
      break;
    default:
      expect(viewOrNotView).to.be.oneOf(['views', 'should not view']);
  }
});

Then('the user views Delete topic modal for {string}', function (topicName) {
  topicName = commonlib.stringReplacement(topicName, replacementString);
  commentObj.deleteTopicModalHeading().invoke('text').should('eq', 'Delete topic');
  commentObj.deleteTopicModalContentTopicName().invoke('text').should('contain', topicName);
});

Then('the user views the message of associated comments with {string} to be deleted', function (topicName) {
  topicName = commonlib.stringReplacement(topicName, replacementString);
  commentObj
    .deleteTopicModalContentNote()
    .invoke('text')
    .should('contains', '*Please note that all associated comments with ' + topicName + ' will be deleted as well.');
});

When('the user clicks Delete button in Delete topic modal', function () {
  commentObj.deleteTopicModalDeleteBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views {string} comments', function (number) {
  commentObj.commentsList().should('have.length', Number(number));
});

When('the user clicks View older comments button', function () {
  commentObj.commentsListViewOlderCommentsBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views more than {string} comments', function (number) {
  commentObj.commentsList().should('have.length.above', Number(number));
});

Then('the user views Core types below the tenant topic types list', function () {
  commentObj.topicTypesCoreTypesTitleAfterTopicTypeTable().should('exist');
});

Then(
  'the user views core types with {string}, {string}, {string}',
  function (titleName, titleToicTypeId, titleSecurityClassification) {
    commentObj.topicTypesCoreTypesTableTitles().then((elements) => {
      cy.wrap(elements[0]).invoke('text').should('eq', titleName);
      cy.wrap(elements[1]).invoke('text').should('eq', titleToicTypeId);
      cy.wrap(elements[2]).invoke('text').should('eq', titleSecurityClassification);
    });
  }
);

Then('the user views only eye icon for core topic Types', function () {
  commentObj.topicTypesCoreTypesTableRows().then((elements) => {
    for (let i = 0; i < elements.length; i++) {
      cy.wrap(elements[i]).find('goa-icon-button').should('have.length', 1); // Only 1 button
      cy.wrap(elements[i]).find('goa-icon-button').invoke('attr', 'icon').should('eq', 'eye'); // button icon is eye
    }
  });
});
