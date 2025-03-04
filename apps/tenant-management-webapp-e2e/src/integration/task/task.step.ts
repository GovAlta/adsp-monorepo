import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import TaskPage from './task.page';
import common from '../common/common.page';

const commonObj = new common();
const taskObj = new TaskPage();

When('the user clicks Add queue button on task service overview page', function () {
  commonObj.activeTab().should('have.text', 'Overview');
  taskObj.addQueueBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views Add queue modal', function () {
  taskObj.addQueueModalTitle().invoke('text').should('eq', 'Add queue');
});

When('the user clicks Cancel button in Add queue modal', function () {
  taskObj.queueModalCancelButton().shadow().find('button').click({ force: true });
});

Then('the user views Queues page', function () {
  taskObj.queueTable().should('be.visible');
});

When('the user clicks Add queue button on Queues page', function () {
  commonObj.activeTab().should('have.text', 'Queues');
  taskObj.addQueueBtn().shadow().find('button').click({ force: true });
});

When('the user enters {string}, {string} in Add queue modal', function (namespace: string, name: string) {
  taskObj.namespaceTextField().shadow().find('input').clear().type(namespace, { force: true, delay: 200 });
  taskObj.nameTextField().shadow().find('input').clear().type(name, { force: true, delay: 200 });
});

Then('the user views the error message of {string} for Name field in Add queue modal', function (errorMsg) {
  taskObj.nameFormItem().invoke('attr', 'error').should('contain', errorMsg);
});

When('the user clicks Save button in Add queue modal', function () {
  taskObj.queueModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Queue page for {string}, {string}', function (namespace, name) {
  cy.viewport(1920, 1080);
  cy.wait(2000);
  taskObj.queueNamespaceValue().should('have.text', namespace);
  taskObj.queueNameValue().should('have.text', name);
});

When(
  'the user enters {string} as Assigner roles and {string} as Worker roles',
  function (assignerRole: string, workerRole: string) {
    //Unselect all checkboxes
    taskObj
      .queuePageCheckboxesTables()
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

    //Select assigner roles
    if (assignerRole.toLowerCase() != 'empty') {
      const assignerRoles = assignerRole.split(',');
      for (let i = 0; i < assignerRoles.length; i++) {
        taskObj
          .queuePageCheckboxesTables()
          .find('goa-checkbox[testid="Queue-Assigner roles-role-checkbox-' + assignerRoles[i].trim() + '"]')
          .shadow()
          .find('[class^="container"]')
          .click({ force: true });
        cy.wait(1000); // Wait the checkbox status to change before proceeding
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
            .find('.role-name')
            .contains(roleName)
            .next()
            .next()
            .find('goa-checkbox')
            .shadow()
            .find('[class^="container"]')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1000); // Wait the checkbox status to change before proceeding
        } else {
          taskObj
            .queuePageRolesTable()
            .find('.role-name')
            .contains(workerRoles[i].trim())
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

Then('the user clicks Save button on Queue page', function () {
  taskObj.queuePageSaveButton().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then('the user {string} the queue of {string}, {string}', function (action, namespace, name) {
  cy.wait(1000); //Wait for the grid to load all data
  findQueue(namespace, name).then((rowNumber) => {
    switch (action) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(0, 'Queue of ' + namespace + ', ' + name + ' has row #' + rowNumber);
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Queue of ' + namespace + ', ' + name + ' has row #' + rowNumber);
        break;
      default:
        expect(action).to.be.oneOf(['views', 'should not view']);
    }
  });
});

//Find queue with namespace, name
//Input: namespace, name in a string
//Return: row number if the queue is found; zero if the queue isn't found
function findQueue(namespace, name) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const targetedNumber = 2;
      taskObj
        .queueTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the namespace cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(namespace)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[1].innerHTML); // Print out the name cell innerHTML for debug purpose
            if (rowElement.cells[1].innerHTML.includes(name)) {
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
            name: 'Row number for the found queue: ',
            message: String(rowNumber),
          });
          resolve(rowNumber);
        });
    } catch (error) {
      reject(error);
    }
  });
}

When('the user clicks {string} button for the queue of {string}, {string}', function (button, namespace, name) {
  findQueue(namespace, name).then((rowNumber) => {
    switch (button) {
      case 'Edit':
        taskObj.queueEditButton(rowNumber).shadow().find('button').click({ force: true });
        cy.wait(2000);
        break;
      case 'Delete':
        taskObj.queueDeleteButton(rowNumber).shadow().find('button').click({ force: true });
        cy.wait(2000);
        break;
      default:
        expect(button).to.be.oneOf(['Edit', 'Delete']);
    }
  });
});

When('the user clicks Back button on Queue page', function () {
  taskObj.queuePageBackButton().shadow().find('button').click({ force: true });
});
