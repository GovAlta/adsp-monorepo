import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import commonlib from '../common/common-library';
import CachePage from './cache.page';

const cacheObj = new CachePage();

Then('the user views {string} section on cache overview page', function (sectionName) {
  cacheObj.cacheOverviewTab().should('exist');
  cacheObj
    .cacheOverviewCachetargetsContent(sectionName)
    .invoke('text')
    .should(
      'contain',
      'Targets are upstream services and APIs that cache service can provide read-through requests to. This configuration is'
    );
});

Given('a tenant admin user is on cache overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Cache', 4000);
});

When('the user clicks Add cache target button on overview tab', function () {
  cacheObj.addCacheTargetOverviewTabBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks Add cache target button', function () {
  cacheObj.addCacheTargetBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Add target modal', function () {
  cacheObj.targetModalTitle().invoke('text').should('eq', 'Add target');
});

When('the user clicks Save button in Add target modal', function () {
  cacheObj.targetModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

When('the user clicks Cancel button in Add target modal', function () {
  cacheObj.targetModalCancelButton().shadow().find('button').click({ force: true });
});

Then('the user views target table header on targets page', function () {
  cacheObj.targetTableHeader().should('be.visible');
});

Then('the user views {string} as the default value for TTL in Add target modal', function (secondNumber) {
  cacheObj.targetModalTtlField().invoke('attr', 'value').should('eq', secondNumber);
});

Then('the user views {string} as TTL unit in Add target modal', function (unitString) {
  cacheObj.targetModalTtlFieldTrailingContent().invoke('text').should('eq', unitString);
});

When('the user enters {string}, {string} in Add target modal', function (targetName: string, ttlSeconds: string) {
  cacheObj.targetModalTargetDropdown().shadow().find('input').click({ force: true });
  cacheObj.targetModalTargetDropdown().shadow().find('li').contains(targetName).click({ force: true });
  cy.wait(2000);
  cacheObj.targetModalTtlField().shadow().find('input').clear().type('{del}').type(ttlSeconds, { force: true });
});

Then('the user views the error message of {string} in Add target modal', function (errorMessage) {
  cacheObj.targetModalTargetFormItem().invoke('attr', 'error').should('eq', errorMessage);
});

Then('the user views Save button is disabled in Add target modal', function () {
  cacheObj.targetModalSaveButton().shadow().find('button').should('be.disabled');
});

Then('the user views {string} as read-only value for Url field in Add target modal', function (urlValue) {
  cacheObj.targetModalUrlField().invoke('attr', 'value').should('eq', urlValue);
  cacheObj.targetModalUrlField().shadow().find('input').should('be.disabled');
});

Then('the user {string} the target of {string}, {string}', function (viewOrNot, targetName, ttlSeconds) {
  findTarget(targetName, ttlSeconds).then((rowNumber) => {
    switch (viewOrNot) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(
          0,
          'Target of ' + targetName + ', ' + ttlSeconds + ' has row #' + rowNumber
        );
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Target of ' + targetName + ', ' + ttlSeconds + ' has row #' + rowNumber);
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  });
});

//Find a target with target name, ttl seconds
//Input: target name, ttl seconds
//Return: row number if the target is found; zero if the record isn't found
function findTarget(targetName, ttlSeconds) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const targetedNumber = 2; // Name and ttl seconds need to match to find the record
      cacheObj
        .targetsTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the target name cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(targetName)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[1].innerHTML); // Print out the ttlSeconds cell innerHTML for debug purpose
            if (rowElement.cells[1].innerHTML.includes(ttlSeconds)) {
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

When(
  'the user clicks {string} button for the target of {string}, {string}',
  function (button: string, targetName, ttlSeconds) {
    findTarget(targetName, ttlSeconds).then((rowNumber) => {
      expect(rowNumber).to.be.greaterThan(0, 'target of ' + targetName + ', ' + ttlSeconds + ' has row #' + rowNumber);
      cy.wait(1000); // Wait for buttons to show up
      switch (button.toLowerCase()) {
        case 'edit':
          cacheObj.targetEditButton(rowNumber).shadow().find('button').click({ force: true });
          break;
        case 'delete':
          cacheObj.targetDeleteButton(rowNumber).shadow().find('button').click({ force: true });
          cy.wait(4000);
          break;
        default:
          expect(button).to.be.oneOf(['edit', 'delete']);
      }
    });
  }
);

Then('the user views Edit target modal', function () {
  cacheObj.targetModalTitle().invoke('text').should('eq', 'Edit target');
});

When('the user clicks Cancel button in Edit target modal', function () {
  cacheObj.targetModalCancelButton().shadow().find('button').click({ force: true });
});

Then('the user views Target and Url fields are read-only in Edit target modal', function () {
  cacheObj.targetModalTargetDropdown().shadow().find('input').should('be.disabled');
  cacheObj.targetModalUrlField().shadow().find('input').should('be.disabled');
});

When('the user enters {string} as TTL in Edit target modal', function (ttlSeconds: string) {
  cacheObj.targetModalTtlField().shadow().find('input').clear().type('{del}').type(ttlSeconds, { force: true });
});

When('the user clicks Save button in Edit target modal', function () {
  cacheObj.targetModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});
