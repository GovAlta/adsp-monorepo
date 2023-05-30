import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import ConfigurationServicePage from './configuration-service.page';
import commonlib from '../common/common-library';
import common from '../common/common.page';

const commonObj = new common();
const configurationObj = new ConfigurationServicePage();

Then('the user views a heading of {string} namespace', function (namespace) {
  configurationObj.namespaceTitle(namespace).invoke('text').should('contain', namespace);
});

Then('the user views a {string} under core-service configurations', function (definitionName) {
  configurationObj.configurationDefinitionWithName(definitionName).should('exist');
});

When('the user clicks eye icon of {string} under Platform to view the schema', function (definitionName) {
  configurationObj.configurationDetailsIcon(definitionName).click({ force: true });
  cy.wait(1000);
});

When('the user clicks eye-off icon of {string} under Platform to close the schema', function (definitionName) {
  configurationObj.configurationHideDetailsIcon(definitionName).scrollIntoView().click({ force: true });
});

Then(
  'the user {string} of the schema for {string} and validates {string} in the details',
  function (viewOrNot, definitionName, content) {
    switch (viewOrNot) {
      case 'views':
        configurationObj.configurationSchemaDetails(definitionName).invoke('text').should('contain', content);
        break;
      case 'should not view':
        configurationObj.configurationSchemaDetails(definitionName).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

Given('a tenant admin user is on configuration overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Configuration', 4000);
});

When('the user clicks Add definition button on configuration overview page', function () {
  configurationObj.addConfigurationDefinitionBtn().click();
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Add definition modal', function () {
  configurationObj.configurationDefinitionModalTitle().invoke('text').should('eq', 'Add definition');
});

When('the user enters {string} in namespace field in configuration definition modal', function (namespace) {
  configurationObj.addConfigurationDefinitionModalNamespaceField().clear().type(namespace);
});

When('the user enters {string} in name field in configuration definition modal', function (name) {
  configurationObj.addConfigurationDefinitionModalNameField().clear().type(name);
});

Then(
  'the user views the error message of {string} on namespace in configuration definition modal',
  function (errorMsg) {
    configurationObj.addConfigurationDefinitionModalNamespaceErrorMsg().invoke('text').should('contain', errorMsg);
  }
);

Then('the user views the error message of {string} on name in configuration definition modal', function (errorMsg) {
  configurationObj.addConfigurationDefinitionModalNameErrorMsg().invoke('text').should('contain', errorMsg);
});

When(
  'the user enters {string} in namespace and {string} in name, {string} in description in configuration definition modal',
  function (namespace, name, desc) {
    configurationObj.addConfigurationDefinitionModalNamespaceField().clear().type(namespace);
    configurationObj.addConfigurationDefinitionModalNameField().clear().type(name);
    configurationObj
      .addConfigurationDefinitionModalDescField()
      .shadow()
      .find('.goa-textarea')
      .clear()
      .type(desc, { force: true });
  }
);

When('the user clicks Save button in configuration definition modal', function () {
  configurationObj.configurationDefinitionModalSaveBtn().click();
  cy.wait(2000); // Wait for the record to save and show in the grid
});

When('the user clicks Cancel button in configuration definition modal', function () {
  configurationObj.configurationDefinitionModalCancelBtn().click();
  cy.wait(1000); // Wait for the record to save and show in the grid
});

Then(
  'the user {string} the configuration definition of {string}, {string} under {string}',
  function (viewOrNot, name, desc, namespace) {
    switch (viewOrNot) {
      case 'views':
        configurationObj.configurationDefinition(namespace, name, desc).should('exist');
        break;
      case 'should not view':
        configurationObj.configurationDefinition(namespace, name, desc).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);

When(
  'the user clicks {string} button for the configuration definition of {string}, {string} under {string}',
  function (buttonName, name, desc, namespace) {
    switch (buttonName.toLowerCase()) {
      case 'edit':
        configurationObj.configurationDefinitionEditBtn(namespace, name, desc).click({ force: true });
        break;
      case 'delete':
        configurationObj.configurationDefinitionDeleteBtn(namespace, name, desc).click({ force: true });
        break;
      case 'eye':
        configurationObj.configurationDefinitionEyeBtn(namespace, name, desc).click({ force: true });
        break;
      default:
        expect(buttonName.toLowerCase()).to.be.oneOf(['edit', 'delete', 'eye']);
    }
  }
);

Then('the user views Edit definition modal', function () {
  configurationObj.configurationDefinitionModalTitle().invoke('text').should('eq', 'Edit definition');
});

Then('the user views disabled namespace and name fields in configuration definition modal', function () {
  configurationObj.addConfigurationDefinitionModalNamespaceField().should('be.disabled');
  configurationObj.addConfigurationDefinitionModalNameField().should('be.disabled');
});

When('the user enters {string} in description in configuration definition modal', function (desc) {
  configurationObj
    .addConfigurationDefinitionModalDescField()
    .shadow()
    .find('.goa-textarea')
    .clear({ force: true })
    .type(desc, { force: true });
});

When('the user enters "{string}" in payload schema in configuration definition modal', function (desc) {
  configurationObj
    .addConfigurationDefinitionModalDescField()
    .shadow()
    .find('.goa-textarea')
    .clear()
    .type(desc, { force: true });
});

When('the user enters {string} in payload schema in configuration definition modal', function (payload) {
  configurationObj
    .configurationDefinitionModalPayloadEditor()
    .click({ force: true })
    .focus()
    .clear({ force: true })
    .type(payload, { force: true });
});

// payload parameter has payload content without "{}"
// for example:
// payload variable would be: "name": "test"
// for the complete payload of
// {
//   "name": "test"
// }
Then(
  'the user views the payload schema containing {string} for {string}, {string} under {string}',
  function (payload, name, desc, namespace) {
    configurationObj.configurationDefinitionDetails(namespace, name, desc).invoke('text').should('contain', payload);
  }
);

Given('a tenant admin user is on configuration export page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Configuration', 4000);
  commonObj.serviceTab('Configuration', 'Export').click();
  cy.wait(2000);
});

When('the user clicks info icon of {string}, {string} on configuration export page', function (namespace, name) {
  configurationObj.exportServiceInfoIcon(namespace, name).click();
});

Then(
  'the user views the description of {string} for {string}, {string} on configuration export page',
  function (desc, namespace, name) {
    configurationObj.exportServiceInfoBubble(namespace, name).invoke('text').should('contain', desc);
  }
);
