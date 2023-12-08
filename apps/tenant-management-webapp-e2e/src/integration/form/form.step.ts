import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import FormPage from './form.page';
import common from '../common/common.page';

const commonObj = new common();
const formObj = new FormPage();

Given('a tenant admin user is on form service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Form', 4000);
});

When('the user clicks Add definition button on form service overview page', function () {
  commonObj.activeTab().should('have.text', 'Overview');
  formObj.addDefinitionBtn().shadow().find('button').click({ force: true });
});

Then('the user views Add form definition modal', function () {
  formObj.addDefinitionModalTitle().invoke('text').should('eq', 'Add definition');
});

When('the user clicks Cancel button in Add form definition modal', function () {
  formObj.addDefinitionModalCancelButton().shadow().find('button').click({ force: true });
});

Then('the user views form definitions page', function () {
  formObj.definitionTable().should('be.visible');
});

When('the user clicks Add definition button on form definitions page', function () {
  commonObj.activeTab().should('have.text', 'Definitions');
  formObj.addDefinitionBtn().shadow().find('button').click({ force: true });
});

When('the user enters {string}, {string} in Add form definition modal', function (name, description) {
  formObj.addDefinitionNameTextField().shadow().find('input').clear().type(name, { force: true, delay: 200 });
  formObj.addDefinitionDescriptionField().shadow().find('.goa-textarea').clear().type(description, { force: true });
});

Then('the user views the error message of {string} for Name field in Add form definition modal', function (errorMsg) {
  formObj.nameFormItem().shadow().find('.error-msg').invoke('text').should('contain', errorMsg);
});

When('the user clicks Save button in Add form definition modal', function () {
  formObj.addDefinitionModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views form definition editor for {string}, {string}', function (name, description) {
  cy.viewport(1920, 1080);
  cy.wait(1000);
  formObj.editorDefinitionNameValue().should('have.text', name);
  formObj.editorDefinitionDescriptionValue().should('contain.text', description);
});

When(
  'the user enters {string} as applicant roles, {string} as clerk roles, {string} as assessor roles',
  function (applicantRole, clerkRole, assessorRole) {
    //Unselect all checkboxes
    //Looks like checkboxes can't handle fast clicking to uncheck multiple checkboxes and seems only the last checked checkboxes are unchecked.
    //Didn't find a way to add a delay between clicks. Use 5 loops to make sure missed checked checkboxes are unchecked.
    for (let j = 0; j < 5; j++) {
      cy.wait(500);
      formObj
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

    //Select applicant roles
    if (applicantRole.toLowerCase() != 'empty') {
      const applicantRoles = applicantRole.split(',');
      for (let i = 0; i < applicantRoles.length; i++) {
        if (applicantRoles[i].includes(':')) {
          const applicantClientRoleStringArray = applicantRoles[i].split(':');
          let clientName = '';
          for (let j = 0; j < applicantClientRoleStringArray.length - 1; j++) {
            if (j !== applicantClientRoleStringArray.length - 2) {
              clientName = clientName + applicantClientRoleStringArray[j].trim() + ':';
            } else {
              clientName = clientName + applicantClientRoleStringArray[j];
            }
          }
          const applicantRoleName = applicantClientRoleStringArray[applicantClientRoleStringArray.length - 1];
          formObj
            .editorClientRolesTable(clientName)
            .shadow()
            .find('.role-name')
            .contains(applicantRoleName)
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        } else {
          formObj
            .editorRolesTable()
            .shadow()
            .find('.role-name')
            .contains(applicantRoles[i].trim())
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

    //Select clerk roles
    if (clerkRole.toLowerCase() != 'empty') {
      const clerkRoles = clerkRole.split(',');
      for (let i = 0; i < clerkRoles.length; i++) {
        if (clerkRoles[i].includes(':')) {
          const clerkClientRoleStringArray = clerkRoles[i].split(':');
          let clientName = '';
          for (let j = 0; j < clerkClientRoleStringArray.length - 1; j++) {
            if (j !== clerkClientRoleStringArray.length - 2) {
              clientName = clientName + clerkClientRoleStringArray[j].trim() + ':';
            } else {
              clientName = clientName + clerkClientRoleStringArray[j];
            }
          }
          const clerkRoleName = clerkClientRoleStringArray[clerkClientRoleStringArray.length - 1];
          formObj
            .editorClientRolesTable(clientName)
            .shadow()
            .find('.role-name')
            .contains(clerkRoleName)
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('.goa-checkbox-container')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        } else {
          formObj
            .editorRolesTable()
            .shadow()
            .find('.role-name')
            .contains(clerkRoles[i].trim())
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

    //Select assessor roles
    if (assessorRole.toLowerCase() != 'empty') {
      const assessorRoles = assessorRole.split(',');
      for (let i = 0; i < assessorRoles.length; i++) {
        if (assessorRoles[i].includes(':')) {
          const assessorClientRoleStringArray = assessorRoles[i].split(':');
          let clientName = '';
          for (let j = 0; j < assessorClientRoleStringArray.length - 1; j++) {
            if (j !== assessorClientRoleStringArray.length - 2) {
              clientName = clientName + assessorClientRoleStringArray[j].trim() + ':';
            } else {
              clientName = clientName + assessorClientRoleStringArray[j];
            }
          }
          const assessorRoleName = assessorClientRoleStringArray[assessorClientRoleStringArray.length - 1];
          formObj
            .editorClientRolesTable(clientName)
            .shadow()
            .find('.role-name')
            .contains(assessorRoleName)
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
          formObj
            .editorRolesTable()
            .shadow()
            .find('.role-name')
            .contains(assessorRoles[i].trim())
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

Then('the user clicks Save button on form definition editor', function () {
  formObj.editorSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user {string} the form definition of {string}, {string}', function (action, name, description) {
  cy.wait(1000); //Wait for the grid to load all data
  findDefinition(name, description).then((rowNumber) => {
    switch (action) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(0, 'Definition of ' + name + ', ' + description + ' has row #' + rowNumber);
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Definition of ' + name + ', ' + description + ' has row #' + rowNumber);
        break;
      default:
        expect(action).to.be.oneOf(['views', 'should not view']);
    }
  });
});

//Find definition with name, description
//Input: name, description in a string separated with comma
//Return: row number if the form definition is found; zero if the definition isn't found
function findDefinition(name, description) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      let targetedNumber = 2;
      formObj
        .definitionsTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the namespace cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(name)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[2].innerHTML); // Print out the name cell innerHTML for debug purpose
            if (rowElement.cells[2].innerHTML.includes(description)) {
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
            name: 'Row number for the found definition: ',
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
  'the user clicks {string} button for the form definition of {string}, {string}',
  function (button, name, description) {
    findDefinition(name, description).then((rowNumber) => {
      switch (button) {
        case 'Edit':
          formObj.definitionEditButton(rowNumber).shadow().find('button').click({ force: true });
          cy.wait(2000);
          break;
        case 'Delete':
          formObj.definitionDeleteButton(rowNumber).shadow().find('button').click({ force: true });
          cy.wait(2000);
          break;
        default:
          expect(button).to.be.oneOf(['Edit', 'Delete']);
      }
    });
  }
);

When('the user clicks Back button on form definition editor', function () {
  formObj.editorBackButton().shadow().find('button').click({ force: true });
});
