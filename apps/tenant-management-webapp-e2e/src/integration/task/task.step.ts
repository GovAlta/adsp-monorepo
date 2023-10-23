import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import TaskPage from './task.page';
import common from '../common/common.page';

const commonObj = new common();
const taskObj = new TaskPage();

Given('a tenant admin user is on task service overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Task', 4000);
});

When('the user clicks Add queue button on task service overview page', function () {
  commonObj.activeTab().should('have.text', 'Overview');
  taskObj.addQueueBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Add queue modal', function () {
  taskObj.addQueueModalTitle().invoke('text').should('eq', 'Add queue');
});

When('the user clicks Cancel button in Add queue modal', function () {
  taskObj.queueModalCancelButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Queues page', function () {
  taskObj.queueTable().should('be.visible');
});

When('the user clicks Add queue button on Queues page', function () {
  commonObj.activeTab().should('have.text', 'Queues');
  taskObj.addQueueBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user enters {string}, {string} in Add queue modal', function (namespace, name) {
  taskObj.namespaceTextField().clear().type(namespace, { delay: 100 });
  taskObj.nameTextField().clear().type(name);
});

Then('the user views the error message of {string} for Name field in Add queue modal', function (errorMsg) {
  taskObj.nameErrorMessage().invoke('text').should('contain', errorMsg);
});

When('the user clicks Save button in Add queue modal', function () {
  taskObj.queueModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Queue page for {string}, {string}', function (namespace, name) {
  cy.viewport(1920, 1080);
  taskObj.queueNamespaceValue().should('have.text', namespace);
  taskObj.queueNameValue().should('have.text', name);
});

When('the user enters {string} as Assigner roles and {string} as Worker roles', function (assignerRole, workerRole) {
  //Unselect all checkboxes
  taskObj
    .queuePageCheckboxesTables()
    .shadow()
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

  //Select assigner roles
  if (assignerRole.toLowerCase() != 'empty') {
    const assignerRoles = assignerRole.split(',');
    for (let i = 0; i < assignerRoles.length; i++) {
      taskObj
        .queuePageCheckboxesTables()
        .shadow()
        .find('goa-checkbox[data-testid="Queue-Assigner roles-role-checkbox-' + assignerRoles[i].trim() + '"]')
        .shadow()
        .find('.goa-checkbox-container')
        .click({ force: true, multiple: true });
    }
  }

  //Select worker roles
  if (workerRole.toLowerCase() != 'empty') {
    const workerRoles = workerRole.split(',');
    for (let i = 0; i < workerRoles.length; i++) {
      if (workerRoles[i].includes(':')) {
        const clientRoleStringArray = workerRoles[i].split(':');
        let clientName = '';
        for (let j = 0; j < clientRoleStringArray.length - 1; j++) {
          if (j !== clientRoleStringArray.length - 2) {
            clientName = clientName + clientRoleStringArray[j].trim() + ':';
          } else {
            clientName = clientName + clientRoleStringArray[j];
          }
        }
        const roleName = clientRoleStringArray[clientRoleStringArray.length - 1];
        taskObj
          .queuePageClientRolesTable(clientName)
          .shadow()
          .find('.role-name')
          .contains(roleName)
          .next()
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      } else {
        taskObj
          .queuePageRolesTable()
          .shadow()
          .find('.role-name')
          .contains(workerRoles[i].trim())
          .next()
          .next()
          .find('goa-checkbox')
          .shadow()
          .find('.goa-checkbox-container')
          .scrollIntoView()
          .click({ force: true });
      }
    }
  }
});

Then('the user clicks Save button on Queue page', function () {
  taskObj.queueSavebutton().shadow().find('button').click({ force: true });
});
