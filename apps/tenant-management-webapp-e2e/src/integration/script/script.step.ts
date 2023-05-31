import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
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
  scriptObj.addScriptBtn().click();
  cy.wait(2000);
});

Then('the user views Add script modal', function () {
  scriptObj.addScriptModalTitle().invoke('text').should('eq', 'Add script');
});

When('the user enters {string} in name field in script modal', function (name) {
  scriptObj.addScriptModalNameField().clear().type(name);
});

Then('the user views the error message of {string} on namespace in script modal', function (errorMsg) {
  scriptObj.addScriptModalNameErrorMsg().invoke('text').should('contain', errorMsg);
});

When(
  'the user enters {string}, {string}, {string}, {string} in Add script modal',
  function (name, desc, useServiceAcct, role) {
    const roles = role.split(',');
    scriptObj.addScriptModalNameField().clear().type(name);
    scriptObj.addScriptModalDescriptionField().shadow().find('.goa-textarea').clear().type(desc, { force: true });
    switch (useServiceAcct) {
      case 'yes':
        scriptObj.addScriptModalUseServiceAccountCheckbox().shadow().find('.goa-checkbox-container').click();
        break;
      case 'no':
        break;
      default:
        expect(useServiceAcct).to.be.oneOf(['yes', 'no']);
    }
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].includes(':')) {
        const clientRoleStringArray = roles[i].split(':');
        scriptObj
          .addScriptModalRolesCheckbox(clientRoleStringArray[clientRoleStringArray.length - 1])
          .shadow()
          .find('.goa-checkbox-container')
          .click();
      } else {
        scriptObj.addScriptModalRolesCheckbox(roles[i].trim()).shadow().find('.goa-checkbox-container').click();
      }
    }
  }
);

When('the user clicks Save button in Add script modal', function () {
  scriptObj.scriptModalSaveButton().click({ force: true });
  cy.wait(2000);
});

When('the user clicks Cancel button in Add script modal', function () {
  scriptObj.scriptModalCancelButton().click();
  cy.wait(1000);
});

Then('the user {string} the script of {string}, {string}, {string}', function (viewOrNot, name, desc, role) {
  findScript(name, desc, role).then((rowNumber) => {
    switch (viewOrNot) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(
          0,
          'Script of ' + name + ', ' + desc + ', ' + role + ' has row #' + rowNumber
        );
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Script of ' + name + ', ' + desc + ', ' + role + ' has row #' + rowNumber);
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  });
});

//Find a script with name, description and role(s)
//Input: script name, script description, role(s) in a string separated with comma
//Return: row number if the script is found; zero if the script isn't found
function findScript(name, desc, role) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const roles = role.split(',');
      const targetedNumber = roles.length + 2; // Name, description and roles all need to match to find the script
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
            // cy.log(rowElement.cells[3].innerHTML); // Print out the role cell innerHTML for debug purpose
            roles.forEach((runningRole) => {
              if (rowElement.cells[3].innerHTML.includes(runningRole.trim())) {
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

When(
  'the user clicks {string} button for the script of {string}, {string}, {string}',
  function (button, name, desc, role) {
    findScript(name, desc, role).then((rowNumber) => {
      expect(rowNumber).to.be.greaterThan(
        0,
        'Script of ' + name + ', ' + desc + ', ' + role + ' has row #' + rowNumber
      );
      cy.wait(1000); // Wait for buttons to show up
      switch (button.toLowerCase()) {
        case 'edit':
          scriptObj.scriptEditButton(rowNumber).click({ force: true });
          break;
          break;
        case 'delete':
          scriptObj.scriptDeleteButton(rowNumber).click();
          break;
        default:
          expect(button).to.be.oneOf(['edit', 'delete']);
      }
    });
  }
);

Then('the user views Edit script modal', function () {
  scriptObj.editScriptModal().should('exist');
});

When('the user enters {string} as name {string} as description in Edit script modal', function (name, description) {
  scriptObj.editScriptModalNameField().clear().type(name);
  scriptObj.editScriptModalDescriptionField().shadow().find('.goa-textarea').clear().type(description, { force: true });
});

When('the user enters {string} as lua script', function (script) {
  scriptObj
    .editScriptModalLuaScriptEditor()
    .click({ force: true })
    .focus()
    .clear({ force: true })
    .type(script, { force: true });
});

When('the user clicks Save button in Edit script modal', function () {
  cy.wait(1000); // Wait for the button to enable
  scriptObj.editScriptModalSaveBtn().shadow().find('button').scrollIntoView().click({ force: true });
  cy.wait(2000); // Wait for the save operation
});
