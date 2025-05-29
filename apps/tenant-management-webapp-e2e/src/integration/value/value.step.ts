import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import value from './value.page';
import commonlib from '../common/common-library';
import common from '../common/common.page';

const valueObj = new value();
const commonObj = new common();
let responseObj: Cypress.Response<any>;

Given('a tenant admin user is on value overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Value', 4000);
});

Given('a tenant admin user is on value definitions page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Value', 4000);
  commonObj.serviceTab('Value', 'Definitions').click();
  cy.wait(4000);
});

When('the user clicks Add definition button on value service overview page', function () {
  valueObj.valueOverviewAddDefinitionButton().shadow().find('button').click({ force: true });
});

Then('the user views Add value definition modal', function () {
  valueObj.valueAddDefinitionModal().should('exist');
});

Then('the user is on {string} tab of value service', function (tabName) {
  valueObj.valueActiveTab().invoke('text').should('eq', tabName);
});

When('the user clicks Add definition button on value definitions page', function () {
  cy.viewport(1920, 1080);
  valueObj.valueDefinitionsAddDefinitionButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then(
  'the user enters {string}, {string}, {string}, {string} in value definition modal',
  function (namespace: string, name: string, desc: string, schema: string) {
    // cy.viewport(1920, 1080);
    if (namespace !== 'N/A') {
      valueObj
        .valueDefinitionsDefinitionModalNamespace()
        .shadow()
        .find('input')
        .clear()
        .type(namespace, { delay: 200, force: true });
    }
    if (name !== 'N/A') {
      valueObj
        .valueDefinitionsDefinitionModalName()
        .shadow()
        .find('input')
        .clear()
        .type(name, { delay: 200, force: true });
    }
    if (desc !== 'N/A') {
      valueObj
        .valueDefinitionsDefinitionModalDescription()
        .shadow()
        .find('textarea')
        .clear()
        .type(desc, { force: true });
    }
    if (schema !== 'N/A') {
      // Clearing schema field doesn't always work. Try 3 times of clearing before entering user data
      for (let j = 0; j < 3; j++) {
        valueObj
          .valueDefinitionsDefinitionModalSchema()
          .click({ force: true })
          .focus()
          .type('{ctrl}a', { force: true })
          .wait(1000)
          .clear({ force: true });
      }
      cy.wait(1000);
      valueObj
        .valueDefinitionsDefinitionModalSchema()
        .click({ force: true })
        .focus()
        .type(schema, { force: true, parseSpecialCharSequences: false });
    }
  }
);

Then('the user views Save button being {string}', function (enableDisable) {
  switch (enableDisable) {
    case 'enabled':
      valueObj.valueDefinitionsDefinitionModalSaveBtn().shadow().find('button').should('be.enabled');
      break;
    case 'disabled':
      valueObj.valueDefinitionsDefinitionModalSaveBtn().shadow().find('button').should('be.disabled');
      break;
    default:
      expect(enableDisable).to.be.oneOf(['enabled', 'disabled']);
  }
});

When('the user clicks Cancel button in value definition modal', function () {
  valueObj.valueDefinitionsDefinitionModalCancelBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

When('the user clicks Save button in value definition modal', function () {
  valueObj.valueDefinitionsDefinitionModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then(
  'the user {string} the value definition of {string}, {string}, {string}',
  function (viewOrNot, namespace, name, desc) {
    switch (viewOrNot) {
      case 'views':
        valueObj.valueDefinitionsDefinition(namespace, name, desc).should('exist');
        break;
      case 'should not view':
        valueObj.valueDefinitionsDefinition(namespace, name, desc).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

Then('the user views a validation error of duplicate value name', function () {
  valueObj
    .valueDefinitionsDefinitionModalNameFormItem()
    .invoke('attr', 'error')
    .should('contain', 'Duplicate Value name');
});

When(
  'the user clicks {string} button of the value definition of {string}, {string}, {string}',
  function (buttonName: string, namespace, name, desc) {
    switch (buttonName.toLowerCase()) {
      case 'edit':
        valueObj
          .valueDefinitionsDefinitionEditBtn(namespace, name, desc)
          .shadow()
          .find('button')
          .click({ force: true });
        break;
      case 'delete':
        valueObj
          .valueDefinitionsDefinitionDeleteBtn(namespace, name, desc)
          .shadow()
          .find('button')
          .click({ force: true });
        break;
      case 'eye':
        valueObj
          .valueDefinitionsDefinitionEyeBtn(namespace, name, desc)
          .invoke('attr', 'icon')
          .then((iconValue) => {
            if (iconValue == 'eye') {
              valueObj
                .valueDefinitionsDefinitionEyeBtn(namespace, name, desc)
                .shadow()
                .find('button')
                .click({ force: true });
              cy.wait(1000);
              valueObj
                .valueDefinitionsDefinitionEyeBtn(namespace, name, desc)
                .invoke('attr', 'icon')
                .should('eq', 'eye-off');
            }
          });
        break;
      default:
        expect(buttonName.toLowerCase()).to.be.oneOf(['edit', 'delete', 'eye']);
    }
  }
);

Then('the user views Edit value definition modal', function () {
  valueObj.valueAddDefinitionModalHeading().invoke('text').should('eq', 'Edit definition');
});

Then('the user views namespace and name fields are read-only', function () {
  valueObj.valueDefinitionsDefinitionModalNamespace().shadow().find('input').should('be.disabled');
  valueObj.valueDefinitionsDefinitionModalName().shadow().find('input').should('be.disabled');
});

Then(
  'the user views the payload schema containing {string} for the value definition of {string}, {string}, {string}',
  function (payload, namespace, name, desc) {
    valueObj.valueDefinitionsDefinitionDetails(namespace, name, desc).invoke('text').should('contain', payload);
  }
);

Then(
  'the user {string} {string} button of the core value definition of {string}, {string}, {string}',
  function (viewOrNot, buttonName: string, namespace, name, desc) {
    switch (buttonName.toLowerCase()) {
      case 'edit':
        switch (viewOrNot) {
          case 'views':
            valueObj.valueDefinitionsDefinitionEditBtn(namespace, name, desc).should('exist');
            break;
          case 'should not view':
            valueObj.valueDefinitionsDefinitionEditBtn(namespace, name, desc).should('not.exist');
            break;
          default:
            expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
        }
        break;
      case 'delete':
        switch (viewOrNot) {
          case 'views':
            valueObj.valueDefinitionsDefinitionDeleteBtn(namespace, name, desc).should('exist');
            break;
          case 'should not view':
            valueObj.valueDefinitionsDefinitionDeleteBtn(namespace, name, desc).should('not.exist');
            break;
          default:
            expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
        }
        break;
      case 'eye':
        switch (viewOrNot) {
          case 'views':
            valueObj.valueDefinitionsDefinitionEyeBtn(namespace, name, desc).should('exist');
            break;
          case 'should not view':
            valueObj.valueDefinitionsDefinitionEyeBtn(namespace, name, desc).should('not.exist');
            break;
          default:
            expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
        }
        break;
      default:
        expect(buttonName.toLowerCase()).to.be.oneOf(['edit', 'delete', 'eye']);
    }
  }
);

Then('the user views {string} namespace under Core definitions heading', function (coreNamespace) {
  valueObj.valueDefinitionsCoreDefinitionNamespace(coreNamespace).should('exist');
});

When(
  'a developer sends a value service get events request with {string}, {string} and {string}',
  function (requestEndpoint: string, requestType: string, interval) {
    const valueServiceGetEventEndPoint = requestEndpoint.replace('<interval>', interval as string);
    const valueServiceGetEventURL = Cypress.env('valueServiceApiUrl') + valueServiceGetEventEndPoint;
    cy.request({
      method: requestType,
      url: valueServiceGetEventURL,
      failOnStatusCode: false,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
    }).then(function (response) {
      responseObj = response;
    });
  }
);

Then('{string} is returned with top 5 events in the response', function (statusCode: string) {
  expect(responseObj.status).to.equal(parseInt(statusCode));
  expect(responseObj.body.page.size).to.be.eq(5);
});
