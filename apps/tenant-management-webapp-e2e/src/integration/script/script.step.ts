import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import commonlib from '../common/common-library';
import ScriptPage from './script.page';

const scriptObj = new ScriptPage();

Given('a tenant admin user is on script service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Script', 4000);
});

When('the user clicks Add script button', function () {
  scriptObj.addScriptBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Add script modal', function () {
  scriptObj.addScriptModalTitle().invoke('text').should('eq', 'Add script');
});

When('the user enters {string} in name field in script modal', function (name: string) {
  scriptObj.addScriptModalNameField().shadow().find('input').clear().type(name, { delay: 100, force: true });
});

Then('the user views the error message of {string} on namespace in script modal', function (errorMsg) {
  scriptObj
    .addScriptModalNameFormItem()
    .shadow()
    .find('[class="error-msg"]')
    .invoke('text')
    .should('contain', errorMsg);
});

When(
  'the user enters {string}, {string}, {string}, {string} in Add script modal',
  function (name: string, desc: string, useServiceAcct, role: string) {
    cy.viewport(1920, 1080);
    scriptObj.addScriptModalNameField().shadow().find('input').clear().type(name, { delay: 100, force: true });
    scriptObj.addScriptModalDescriptionField().shadow().find('textarea').type(desc, { force: true });
    switch (useServiceAcct) {
      case 'yes':
        scriptObj.addScriptModalUseServiceAccountCheckbox().shadow().find('.goa-checkbox-container').click();
        break;
      case 'no':
        break;
      default:
        expect(useServiceAcct).to.be.oneOf(['yes', 'no']);
    }
    // Select roles or client roles
    const roles = role.split(',');
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].includes(':')) {
        const clientRoleStringArray = roles[i].split(':');
        let clientName = '';
        for (let j = 0; j < clientRoleStringArray.length - 1; j++) {
          if (j !== clientRoleStringArray.length - 2) {
            clientName = clientName + clientRoleStringArray[j].trim() + ':';
          } else {
            clientName = clientName + clientRoleStringArray[j];
          }
        }
        const roleName = clientRoleStringArray[clientRoleStringArray.length - 1];
        scriptObj
          .addScriptModalClientRolesTable(clientName)
          .find('.role-name')
          .contains(roleName)
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      } else {
        scriptObj
          .addScriptModalRolesTable()
          .find('.role-name')
          .contains(roles[i].trim())
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      }
    }
  }
);

When('the user clicks Save button in Add script modal', function () {
  scriptObj.scriptModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks Cancel button in Add script modal', function () {
  scriptObj.scriptModalCancelButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user {string} the script of {string}, {string}', function (viewOrNot, name, desc) {
  findScript(name, desc).then((rowNumber) => {
    switch (viewOrNot) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(0, 'Script of ' + name + ', ' + desc + ' has row #' + rowNumber);
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Script of ' + name + ', ' + desc + ', ' + ' has row #' + rowNumber);
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  });
});

//Find a script with name, description
//Input: script name, script description in a string separated with comma
//Return: row number if the script is found; zero if the script isn't found
function findScript(name, desc) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const targetedNumber = 2; // Name and description need to match to find the script
      scriptObj
        .scriptTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the name cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(name)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[2].innerHTML); // Print out the description cell innerHTML for debug purpose
            if (rowElement.cells[2].innerHTML.includes(desc)) {
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
            name: 'Row number for the found script: ',
            message: String(rowNumber),
          });
          resolve(rowNumber);
        });
    } catch (error) {
      reject(error);
    }
  });
}

When('the user clicks {string} button for the script of {string}, {string}', function (button: string, name, desc) {
  findScript(name, desc).then((rowNumber) => {
    expect(rowNumber).to.be.greaterThan(0, 'Script of ' + name + ', ' + desc + ' has row #' + rowNumber);
    cy.wait(1000); // Wait for buttons to show up
    switch (button.toLowerCase()) {
      case 'edit':
        scriptObj.scriptEditButton(rowNumber).shadow().find('button').click({ force: true });
        break;
        break;
      case 'delete':
        scriptObj.scriptDeleteButton(rowNumber).shadow().find('button').click({ force: true });
        break;
      default:
        expect(button).to.be.oneOf(['edit', 'delete']);
    }
  });
});

Then('the user views Edit script modal', function () {
  scriptObj.editScriptModal().should('be.visible');
});

When(
  'the user enters {string} as name {string} as description in Edit script modal',
  function (name: string, description: string) {
    scriptObj.editScriptModalNameField().shadow().find('input').clear().type(name, { delay: 200, force: true });
    scriptObj.editScriptModalDescriptionField().shadow().find('textarea').clear().type(description, { force: true });
  }
);

When('the user enters {string} as lua script', function (script: string) {
  scriptObj
    .editScriptModalLuaScriptEditor()
    .click({ force: true })
    .focus()
    .clear({ force: true })
    .type(script, { force: true });
});

When('the user clicks Save button in Edit script modal', function () {
  cy.wait(1000); // Wait for the button to enable
  scriptObj.editScriptModalSaveButton().shadow().find('button').scrollIntoView().click({ force: true });
  cy.wait(2000); // Wait for the save operation
});

When('the user selects {string} tab in script editor', function (tabName) {
  scriptObj
    .editorTab(tabName)
    .invoke('attr', 'class')
    .then((classAttr) => {
      if (classAttr?.includes('active')) {
        cy.log('Tab is already active');
      } else {
        scriptObj.editorTab(tabName).click();
      }
    });
});

When('the user enters {string} for roles in script editor', function (role: string) {
  // Unselect all existing roles
  //Looks like checkboxes can't handle fast clicking to uncheck multiple checkboxes and seems only the last checked checkboxes are unchecked.
  //Didn't find a way to add a delay between clicks. Use 3 loops to make sure missed checked checkboxes are unchecked.
  for (let j = 0; j < 3; j++) {
    scriptObj
      .editorRolesTabRoleTables()
      .find('goa-checkbox')
      .shadow()
      .find('.goa-checkbox-container')
      .then((elements) => {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].getAttribute('class')?.includes('--selected')) {
            elements[i].click();
            cy.wait(1000);
          }
        }
      });
  }

  // Select roles or client roles
  const roles = role.split(',');
  for (let i = 0; i < roles.length; i++) {
    if (roles[i].includes(':')) {
      const clientRoleStringArray = roles[i].split(':');
      let clientName = '';
      for (let j = 0; j < clientRoleStringArray.length - 1; j++) {
        if (j !== clientRoleStringArray.length - 2) {
          clientName = clientName + clientRoleStringArray[j].trim() + ':';
        } else {
          clientName = clientName + clientRoleStringArray[j];
        }
      }
      const roleName = clientRoleStringArray[clientRoleStringArray.length - 1];
      scriptObj
        .editorClientRolesTable(clientName)
        .find('.role-name')
        .contains(roleName)
        .next()
        .find('goa-checkbox')
        .shadow()
        .find('.goa-checkbox-container')
        .scrollIntoView()
        .click({ force: true });
    } else {
      scriptObj
        .editorRolesTable()
        .find('.role-name')
        .contains(roles[i].trim())
        .next()
        .find('goa-checkbox')
        .shadow()
        .find('.goa-checkbox-container')
        .scrollIntoView()
        .click({ force: true });
    }
  }
});

Then('the user views the script editor for {string}, {string}', function (name, desc) {
  scriptObj.editorNameField().invoke('text').should('contain', name);
  scriptObj.editorDescriptionField().invoke('text').should('contain', desc);
});

When('the user clicks Edit button in script editor', function () {
  scriptObj.editorEditButton().click();
});

When('the user clicks Save button in script editor', function () {
  scriptObj.editorSaveBtn().shadow().find('button').scrollIntoView().click({ force: true });
  cy.wait(2000); // Wait for the save operation
});

When('the user clicks Back button in script editor', function () {
  scriptObj.editorBackBtn().shadow().find('button').scrollIntoView().click({ force: true });
  cy.wait(2000); // Wait for the save operation
});
