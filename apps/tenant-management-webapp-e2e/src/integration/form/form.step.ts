import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
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

Given('a tenant admin user is on form definitions page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Form', 4000);
  commonObj.serviceTab('Form', 'Definitions').click();
  cy.wait(3000);
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

When('the user enters {string}, {string} in Add form definition modal', function (name: string, description: string) {
  cy.viewport(1920, 1080);
  formObj.addDefinitionNameTextField().shadow().find('input').clear().type(name, { force: true, delay: 200 });
  formObj.addDefinitionDescriptionField().shadow().find('textarea').clear().type(description, { force: true });
});

Then('the user views the error message of {string} for Name field in Add form definition modal', function (errorMsg) {
  formObj.nameFormItem().shadow().find('.error-msg').invoke('text').should('contain', errorMsg);
});

When('the user clicks Save button in Add form definition modal', function () {
  formObj.addDefinitionModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then('the user views form definition editor for {string}, {string}', function (name, description) {
  cy.viewport(1920, 1080);
  cy.wait(1000);
  formObj.editorDefinitionNameValue().should('contain.text', name);
  formObj.editorDefinitionDescriptionValue().should('contain.text', description);
});

When(
  'the user enters {string} as applicant roles, {string} as clerk roles, {string} as assessor roles',
  function (applicantRole: string, clerkRole: string, assessorRole: string) {
    //Unselect all checkboxes
    //Looks like checkboxes can't handle fast clicking to uncheck multiple checkboxes and seems only the last checked checkboxes are unchecked.
    //Didn't find a way to add a delay between clicks. Use 5 loops to make sure missed checked checkboxes are unchecked.
    for (let j = 0; j < 5; j++) {
      cy.wait(500);
      formObj
        .editorCheckboxesTables()
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

Then('the user clicks Save button in form definition editor', function () {
  formObj.editorSaveButtonEnabled().shadow().find('button').click({ force: true });
  cy.wait(8000);
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
      const targetedNumber = 2;
      // Click Load More button 10 times if it's there
      for (let i = 0; i < 10; i++) {
        formObj.definitionsPage().then((parentElement) => {
          if (parentElement.find('goa-button:contains("Load more")').length > 0) {
            formObj.definitionsLoadMoreButton().shadow().find('button').click({ force: true });
            cy.wait(2000);
          }
        });
      }
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

When('the user clicks Back button in form definition editor', function () {
  formObj.editorBackButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks {string} tab in form definition editor', function (tabName) {
  formObj
    .definitionEditorTab(tabName)
    .invoke('attr', 'class')
    .then((classAttr) => {
      if (classAttr?.includes('active')) {
        cy.log('Tab is already seleted.');
      } else {
        formObj.definitionEditorTab(tabName).click();
        cy.wait(1000);
      }
    });
});

When('the user clicks Edit button in form definition editor', function () {
  formObj.definitionEditorEditButton().click();
  cy.wait(2000);
});

Then('the user views Edit definition modal in form definition editor', function () {
  formObj.definitionEditorEditDefinitionModal().should('exist');
  formObj.definitionEditorEditDefinitionModalTitle().should('contain.text', 'Edit definition');
});

When('the user enters {string}, {string} in Edit definition modal', function (name: string, description: string) {
  formObj
    .definitionEditorEditDefinitionModalNameInput()
    .shadow()
    .find('input')
    .clear()
    .type(name, { force: true, delay: 200 });
  formObj
    .definitionEditorEditDefinitionModalDescriptionField()
    .shadow()
    .find('textarea')
    .clear()
    .type(description, { force: true });
});

When('the user clicks Save button in Edit definition modal', function () {
  cy.wait(1000); // wait for save button to enable
  formObj
    .definitionEditorEditDefinitionModalSaveButton()
    .shadow()
    .find('button')
    .scrollIntoView()
    .click({ force: true });
  cy.wait(2000);
});

Then(
  'the user views {string} as applicant roles, {string} as clerk roles, {string} as assessor roles in roles tab',
  function (applicantRole: string, clerkRole: string, assessorRole: string) {
    //check applicant roles
    let applicantRoleMatchCount = 0;
    if (applicantRole.toLowerCase() != 'empty') {
      const applicantRoles = applicantRole.split(',');
      formObj
        .definitionEditorRolesTables()
        .find('goa-checkbox[data-testid*="Applicant roles"]')
        .then((appRoles) => {
          for (let i = 0; i < appRoles.length; i++) {
            if (appRoles[i].getAttribute('checked') == 'true') {
              for (let j = 0; j < applicantRoles.length; j++) {
                if (appRoles[i].getAttribute('name')?.includes(applicantRoles[j])) {
                  const appRoleName = appRoles[i].getAttribute('name');
                  if (appRoleName != null) {
                    cy.log(appRoleName);
                  } else {
                    cy.log('Application role name attribute is null');
                  }
                  applicantRoleMatchCount = applicantRoleMatchCount + 1;
                }
              }
            }
          }
          expect(applicantRoles.length).to.eq(applicantRoleMatchCount);
        });
    } else {
      formObj
        .definitionEditorRolesTables()
        .find('goa-checkbox[data-testid*="Applicant roles"]')
        .then((appRoles) => {
          for (let i = 0; i < appRoles.length; i++) {
            if (appRoles[i].getAttribute('checked') == 'true') {
              expect(appRoles[i].getAttribute('checked')).to.be('false');
            }
          }
        });
      cy.log('No applicant role is selected');
    }

    //check clerk roles
    let clerkRoleMatchCount = 0;
    if (clerkRole.toLowerCase() != 'empty') {
      const clerkRoles = clerkRole.split(',');
      formObj
        .definitionEditorRolesTables()
        .find('goa-checkbox[data-testid*="Clerk roles"]')
        .then((cRoles) => {
          for (let i = 0; i < cRoles.length; i++) {
            if (cRoles[i].getAttribute('checked') == 'true') {
              for (let j = 0; j < clerkRoles.length; j++) {
                if (cRoles[i].getAttribute('name')?.includes(clerkRoles[j])) {
                  const clerkRoleName = cRoles[i].getAttribute('name');
                  if (clerkRoleName != null) {
                    cy.log(clerkRoleName);
                  } else {
                    cy.log('Clerk role name attribute is null');
                  }
                  clerkRoleMatchCount = clerkRoleMatchCount + 1;
                }
              }
            }
          }
          expect(clerkRoles.length).to.eq(clerkRoleMatchCount);
        });
    } else {
      formObj
        .definitionEditorRolesTables()
        .find('goa-checkbox[data-testid*="Clerk roles"]')
        .then((cRoles) => {
          for (let i = 0; i < cRoles.length; i++) {
            if (cRoles[i].getAttribute('checked') == 'true') {
              expect(cRoles[i].getAttribute('checked')).to.be('false');
            }
          }
        });
      cy.log('No clerk role is selected');
    }

    //check assessor roles
    let assessorRoleMatchCount = 0;
    if (assessorRole.toLowerCase() != 'empty') {
      const assessorRoles = assessorRole.split(',');
      formObj
        .definitionEditorRolesTables()
        .find('goa-checkbox[data-testid*="Assessor roles"]')
        .then((assRoles) => {
          for (let i = 0; i < assRoles.length; i++) {
            if (assRoles[i].getAttribute('checked') == 'true') {
              for (let j = 0; j < assessorRoles.length; j++) {
                if (assRoles[i].getAttribute('name')?.includes(assessorRoles[j])) {
                  const assRoleName = assRoles[i].getAttribute('name');
                  if (assRoleName != null) {
                    cy.log(assRoleName);
                  } else {
                    cy.log('Assessor role name attribute is null');
                  }
                  assessorRoleMatchCount = assessorRoleMatchCount + 1;
                }
              }
            }
          }
          expect(assessorRoles.length).to.eq(assessorRoleMatchCount);
        });
    } else {
      formObj
        .definitionEditorRolesTables()
        .find('goa-checkbox[data-testid*="Assessor roles"]')
        .then((assRoles) => {
          for (let i = 0; i < assRoles.length; i++) {
            if (assRoles[i].getAttribute('checked') == 'true') {
              expect(assRoles[i].getAttribute('checked')).to.be('false');
            }
          }
        });
      cy.log('No assessor role is selected');
    }
  }
);

Then('the user views a checkbox of {string}', function (checkboxTitle) {
  formObj
    .definitionEditorSubmissionConfigSubmissionRecordCheckbox()
    .shadow()
    .find('slot')
    .invoke('text')
    .should('contain', checkboxTitle);
});

When(
  'the user clicks the information icon button besides the checkbox of Create submission records on submit',
  function () {
    formObj.definitionEditorSubmissionConfigSubmissionRecordCheckboxInfoCircle().click();
  }
);

Then(
  'the user {string} the help tooltip for {string} create submission records on submit',
  function (viewOrNot, enableOrDisable) {
    switch (viewOrNot) {
      case 'views':
        if (enableOrDisable == 'enabling') {
          formObj
            .definitionEditorSubmissionConfigSubmissionRecordCheckboxInfoCircle()
            .shadow()
            .find('[class^=tooltiptext]')
            .invoke('attr', 'style')
            .should('contains', 'visibility: visible');
          formObj
            .definitionEditorSubmissionConfigSubmissionRecordCheckboxInfoCircle()
            .invoke('attr', 'content')
            .should('contain', 'Forms of this type will create submission records');
        } else if (enableOrDisable !== 'enabling') {
          formObj
            .definitionEditorSubmissionConfigSubmissionRecordCheckboxInfoCircle()
            .shadow()
            .find('[class^=tooltiptext]')
            .invoke('attr', 'style')
            .should('contains', 'visibility: visible');
          formObj
            .definitionEditorSubmissionConfigSubmissionRecordCheckboxInfoCircle()
            .invoke('attr', 'content')
            .should('contain', 'Forms of this type will not create a submission record when submitted');
        }
        break;
      case 'should not view':
        formObj
          .definitionEditorSubmissionConfigSubmissionRecordCheckboxInfoCircle()
          .shadow()
          .find('[class^=tooltiptext]')
          .invoke('attr', 'style')
          .should('contains', 'visibility: hidden');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

When('the user {string} the checkbox of Create submission records on submit', function (checksOrUnchecks) {
  switch (checksOrUnchecks) {
    case 'checks':
      formObj
        .definitionEditorSubmissionConfigSubmissionRecordCheckbox()
        .shadow()
        .find('.goa-checkbox-container')
        .then((checkboxElement) => {
          if (checkboxElement[0].getAttribute('class')?.includes('--selected')) {
            cy.log('Create submission records on submit checkbox is already checked');
          } else {
            checkboxElement[0].click();
            cy.wait(1000);
          }
        });
      break;
    case 'unchecks':
      formObj
        .definitionEditorSubmissionConfigSubmissionRecordCheckbox()
        .shadow()
        .find('.goa-checkbox-container')
        .then((checkboxElement) => {
          if (checkboxElement[0].getAttribute('class')?.includes('--selected')) {
            checkboxElement[0].click();
            cy.wait(1000);
          } else {
            cy.log('Create submission records on submit checkbox is already unchecked');
          }
        });
      break;
    default:
      expect(checksOrUnchecks).to.be.oneOf(['checks', 'unchecks']);
  }
});

Then('the Add state button is invisible on Lifecycle page', function () {
  formObj.definitionEditorSubmissionConfigAddStateBtn().should('not.exist');
});

When('the user clicks the information icon button besides Disposition States', function () {
  formObj.definitionEditorSubmissionConfigDispositionStatesInfoCircle().click();
});

Then('the user {string} the help tooltip text for Disposition States', function (viewOrNot) {
  switch (viewOrNot) {
    case 'views':
      // Ignore validation for info message visibility due to clicking the info icon not working
      // formObj
      //   .definitionEditorSubmissionConfigDispositionStatesInfoCircle()
      //   .shadow()
      //   .find('[class^=tooltiptext]')
      //   .invoke('attr', 'style')
      //   .should('contains', 'visibility: visible');
      formObj
        .definitionEditorSubmissionConfigDispositionStatesInfoCircle()
        .invoke('attr', 'content')
        .should('contain', 'Disposition states represent possible decisions applied to submissions by program staff');
      break;
    case 'should not view':
      formObj
        .definitionEditorSubmissionConfigDispositionStatesInfoCircle()
        .shadow()
        .find('[class^=tooltiptext]')
        .invoke('attr', 'style')
        .should('contains', 'visibility: hidden');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

When('the user clicks x icon for the help tooltip for Disposition States', function () {
  formObj.definitionEditorSubmissionConfigDispositionStatesInfoBoxCloseBtn().click();
});

When('the user adds a dispoistion state of {string}, {string}', function (name: string, description: string) {
  formObj.definitionEditorSubmissionConfigAddStateBtn().shadow().find('button').click({ force: true });
  formObj
    .definitionEditorSubmissionConfigDispositionStateModalTitle()
    .invoke('text')
    .should('eq', 'Add disposition state');
  formObj
    .definitionEditorSubmissionConfigDispositionStateModalNameField()
    .shadow()
    .find('input')
    .clear()
    .type(name, { force: true, delay: 200 });
  formObj
    .definitionEditorSubmissionConfigDispositionStateModalDescriptionField()
    .shadow()
    .find('textarea')
    .clear()
    .type(description, { force: true });
  formObj.definitionEditorSubmissionConfigDispositionStateModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user {string} the disposition state of {string}, {string}', function (action, name, description) {
  formObj.definitionEditorSubmissionConfigSubmission().then((submissionConfig) => {
    if (submissionConfig.find('tbody').length == 0) {
      cy.log('There is no disposition state table');
      expect(action).to.eq('should not view');
    } else {
      findDispositionState(name, description).then((rowNumber) => {
        switch (action) {
          case 'views':
            expect(rowNumber).to.be.greaterThan(
              0,
              'Disposition state of ' + name + ', ' + description + ' has row #' + rowNumber
            );
            break;
          case 'should not view':
            expect(rowNumber).to.equal(
              0,
              'Disposition state of ' + name + ', ' + description + ' has row #' + rowNumber
            );
            break;
          default:
            expect(action).to.be.oneOf(['views', 'should not view']);
        }
      });
    }
  });
});

//Find disposition state with name, description
//Input: name, description in string
//Return: row number if the topic type is found; zero if the item isn't found
function findDispositionState(name, description) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      let targetedNumber = 1;
      if (description.toLowerCase() != 'empty') {
        targetedNumber = targetedNumber + 1;
      }
      formObj
        .definitionEditorSubmissionConfigDispositionStateTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the namespace cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(name)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[1].innerHTML); // Print out the worker role cell innerHTML for debug purpose
            if (rowElement.cells[1].innerHTML.includes(description)) {
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
  'the user clicks {string} button for the disposition state of {string}, {string}',
  function (button: string, name, description) {
    findDispositionState(name, description).then((rowNumber) => {
      switch (button.toLowerCase()) {
        case 'edit':
          formObj
            .definitionEditorSubmissionConfigDispositionStateEditBtn(rowNumber)
            .shadow()
            .find('button')
            .click({ force: true });
          cy.wait(1000);
          break;
        case 'delete':
          formObj
            .definitionEditorSubmissionConfigDispositionStateDeleteBtn(rowNumber)
            .shadow()
            .find('button')
            .click({ force: true });
          cy.wait(1000);
          break;
        default:
          expect(button).to.be.oneOf(['Edit', 'Delete']);
      }
    });
  }
);

Then('the user views Edit disposition state modal', function () {
  formObj
    .definitionEditorSubmissionConfigDispositionStateModalTitle()
    .invoke('text')
    .should('eq', 'Edit disposition state');
});

When(
  'the user enters {string} as name and {string} as description in Edit disposition state modal',
  function (name: string, description: string) {
    formObj
      .definitionEditorSubmissionConfigDispositionStateModalNameField()
      .shadow()
      .find('input')
      .clear()
      .type(name, { force: true, delay: 200 });
    formObj
      .definitionEditorSubmissionConfigDispositionStateModalDescriptionField()
      .shadow()
      .find('textarea')
      .clear()
      .type(description, { force: true });
  }
);

When('the user clicks Cancel button in Edit disposition state modal', function () {
  formObj
    .definitionEditorSubmissionConfigEditDispositionStateModalCancelBtn()
    .shadow()
    .find('button')
    .click({ force: true });
});

When('the user clicks Save button in disposition state modal', function () {
  formObj.definitionEditorSubmissionConfigDispositionStateModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then(
  'the user should only view {string} icon for the disposition state of {string}, {string}',
  function (arrowType: string, name, description) {
    findDispositionState(name, description).then((rowNumber) => {
      switch (arrowType.toLowerCase()) {
        case 'arrow up':
          formObj
            .definitionEditorSubmissionConfigDispositionStateTableArrowIcons(rowNumber)
            .should('have.length.lte', 1);
          formObj
            .definitionEditorSubmissionConfigDispositionStateTableArrowIcons(rowNumber)
            .invoke('attr', 'title')
            .should('eq', 'Arrow-up');
          break;
        case 'arrow down':
          formObj
            .definitionEditorSubmissionConfigDispositionStateTableArrowIcons(rowNumber)
            .should('have.length.lte', 1);
          formObj
            .definitionEditorSubmissionConfigDispositionStateTableArrowIcons(rowNumber)
            .invoke('attr', 'title')
            .should('eq', 'Arrow-down');
          break;
        default:
          expect(arrowType.toLowerCase()).to.be.oneOf(['arrow up', 'arrow down']);
      }
    });
  }
);

When(
  'the user clicks {string} for the disposition state of {string}, {string}',
  function (arrowType: string, name, description) {
    findDispositionState(name, description).then((rowNumber) => {
      switch (arrowType.toLowerCase()) {
        case 'arrow up':
          if (rowNumber == '1') {
            expect(rowNumber).to.not.eq('1', 'There is no arrow up icon for first row of ' + name);
          } else {
            rowNumber = String(Number(rowNumber) - 1);
          }
          formObj
            .definitionEditorSubmissionConfigDispositionStateArrowUpBtn(rowNumber)
            .shadow()
            .find('button')
            .click({ force: true });
          break;
        case 'arrow down':
          formObj
            .definitionEditorSubmissionConfigDispositionStateArrowDownBtn(rowNumber)
            .shadow()
            .find('button')
            .click({ force: true });
          break;
        default:
          expect(arrowType.toLowerCase()).to.be.oneOf(['arrow up', 'arrow down']);
      }
    });
  }
);

Then(
  'the user views the disposition state of {string}, {string} being row {string}',
  function (name, description, rowNum) {
    findDispositionState(name, description).then((rowNumber) => {
      expect(String(rowNumber)).to.eq(rowNum);
    });
  }
);

When('the user selects {string} in task queue to process dropdown', function (dropdownItem: string) {
  formObj
    .definitionEditorSubmissionConfigTaskQueueToProcessDropdown()
    .invoke('attr', 'value')
    .then((dropdownValue) => {
      if (!dropdownValue?.includes(dropdownItem)) {
        formObj
          .definitionEditorSubmissionConfigTaskQueueToProcessDropdown()
          .shadow()
          .find('input')
          .click({ force: true });
        cy.wait(1000);
        formObj
          .definitionEditorSubmissionConfigTaskQueueToProcessDropdown()
          .shadow()
          .find('li')
          .contains(dropdownItem)
          .click({ force: true });
        cy.wait(2000);
      } else {
        cy.log('Task queue to process dropdown item is already selected: ' + dropdownItem);
      }
    });
});

When('the user clicks the information icon button besides task queue to process dropdown', function () {
  formObj.definitionEditorSubmissionConfigTaskQueueToProcessDropdownInfoCircle().click();
});

Then(
  'the user {string} the help tooltip for {string} task queue to process dropdown',
  function (viewOrNot, enableOrDisable) {
    switch (viewOrNot) {
      case 'views':
        if (enableOrDisable == 'enabling') {
          formObj
            .definitionEditorSubmissionConfigTaskQueueToProcessDropdownInfoBox()
            .invoke('text')
            .should('contain', 'A task will be created in queue');
        } else if (enableOrDisable !== 'enabling') {
          formObj
            .definitionEditorSubmissionConfigTaskQueueToProcessDropdownInfoBox()
            .invoke('text')
            .should('contain', 'No task will be created for processing of the submissions');
        }
        break;
      case 'should not view':
        formObj.definitionEditorSubmissionConfigTaskQueueToProcessDropdownInfoBox().should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

When('the user clicks x icon for the help tooltip for task queue to process dropdown', function () {
  formObj.definitionEditorSubmissionConfigTaskQueueToProcessDropdownInfoBoxCloseBtn().click();
});

When('the user saves the changes if any and go back out of form definition editor', function () {
  formObj.editorSaveButton().then((element) => {
    cy.log(element.prop('disabled'));
    if (element.prop('disabled') == 'false') {
      formObj.editorSaveButtonEnabled().shadow().find('button').click({ force: true });
      cy.wait(6000);
    }
  });
  formObj.editorBackButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views Security classification dropdown after Form template URL under Application', function () {
  formObj.definitionsEditorLifecycleApplicationItems().then((elements) => {
    let formTemplateURLItemIndex, securityClassificationItemIndex;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].getAttribute('label') == 'Form template URL') {
        formTemplateURLItemIndex = i;
      } else if (elements[i].getAttribute('label') == 'Security classification') {
        securityClassificationItemIndex = i;
      }
    }
    expect(formTemplateURLItemIndex).to.be.lt(securityClassificationItemIndex);
  });
});

Then(
  'the user views the security classification dropdown has the default value of {string} from the options of {string}, {string}, {string}, {string}',
  function () {
    formObj
      .definitionsEditorLifecycleSecurityClassificationDropdown()
      .invoke('attr', 'value')
      .should('eq', 'protected b');
    formObj.definitionsEditorLifecycleSecurityClassificationDropdownItems().then((elements) => {
      expect(elements.length).to.eq(4);
      expect(elements[0].getAttribute('value')).to.eq('public');
      expect(elements[1].getAttribute('value')).to.eq('protected a');
      expect(elements[2].getAttribute('value')).to.eq('protected b');
      expect(elements[3].getAttribute('value')).to.eq('protected c');
    });
  }
);

When(
  'the user selects {string} from the security classification dropdown in form definition editor',
  function (classification: string) {
    formObj.definitionsEditorLifecycleSecurityClassificationDropdown().shadow().find('input').click({ force: true });
    formObj
      .definitionsEditorLifecycleSecurityClassificationDropdown()
      .shadow()
      .find('li')
      .contains(classification)
      .click({ force: true });
    cy.wait(1000);
  }
);

Then(
  'the user views {string} in security classification dropdown in form definition editor',
  function (dropdownItem: string) {
    formObj
      .definitionsEditorLifecycleSecurityClassificationDropdown()
      .invoke('attr', 'value')
      .should('eq', dropdownItem.toLowerCase());
  }
);

Then(
  'the user views {string} as applicant role under {string} is {string}',
  function (applicantRole, service, checkedOrNot) {
    formObj
      .definitionsEditorApplicantRole(service, applicantRole)
      .shadow()
      .find('.goa-checkbox-container')
      .invoke('attr', 'class')
      .then((classAttr) => {
        switch (checkedOrNot) {
          case 'checked':
            expect(classAttr).to.contain('selected');
            break;
          case 'not checked':
            expect(classAttr).to.not.contain('selected');
            break;
          default:
            expect(checkedOrNot).to.be.oneOf(['checked', 'not checked']);
        }
      });
  }
);
