import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import ConfigurationServicePage from './configuration-service.page';
import commonlib from '../common/common-library';
import common from '../common/common.page';

const commonObj = new common();
const configurationObj = new ConfigurationServicePage();
const randomNumber = Math.floor(Math.random() * 99) + 1; // random integer between 1 to 99

Then('the user views a heading of {string} namespace', function (namespace) {
  configurationObj.namespaceTitle(namespace).invoke('text').should('contain', namespace);
});

Then('the user views a {string} under core-service configurations', function (definitionName) {
  configurationObj.configurationDefinitionWithName(definitionName).should('exist');
});

When('the user clicks eye icon of {string} under Platform to view the schema', function (definitionName) {
  configurationObj.configurationDetailsIcon(definitionName).shadow().find('button').click({ force: true });
  cy.wait(1000);
});

When('the user clicks eye-off icon of {string} under Platform to close the schema', function (definitionName) {
  configurationObj
    .configurationHideDetailsIcon(definitionName)
    .shadow()
    .find('button')
    .scrollIntoView()
    .click({ force: true });
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

Given('a tenant admin user is on configuration definitions page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Configuration', 4000);
  commonObj.serviceTab('Configuration', 'Definitions').click();
});

When('the user clicks Add definition button on configuration overview page', function () {
  configurationObj.addConfigurationDefinitionBtn().shadow().find('button').click({ force: true });
  cy.wait(1000); // Add a wait to avoid accessibility test to run too quickly before the modal is fully loaded
});

Then('the user views Add configuration definition modal', function () {
  configurationObj.configurationDefinitionModalTitle().invoke('text').should('eq', 'Add definition');
});

When('the user enters {string} in namespace field in configuration definition modal', function (namespace) {
  configurationObj
    .addConfigurationDefinitionModalNamespaceField()
    .shadow()
    .find('input')
    .clear()
    .type(namespace, { delay: 50, force: true });
});

When('the user enters {string} in name field in configuration definition modal', function (name) {
  configurationObj
    .addConfigurationDefinitionModalNameField()
    .shadow()
    .find('input')
    .clear()
    .type(name, { delay: 50, force: true });
});

Then(
  'the user views the error message of {string} on namespace in configuration definition modal',
  function (errorMsg) {
    configurationObj
      .addConfigurationDefinitionModalNamespaceFormItem()
      .shadow()
      .find('.error-msg')
      .invoke('text')
      .should('contain', errorMsg);
  }
);

Then('the user views the error message of {string} on name in configuration definition modal', function (errorMsg) {
  configurationObj
    .addConfigurationDefinitionModalNameFormItem()
    .shadow()
    .find('.error-msg')
    .invoke('text')
    .should('contain', errorMsg);
});

When(
  'the user enters {string} in namespace and {string} in name, {string} in description in configuration definition modal',
  function (namespace, name, desc) {
    configurationObj
      .addConfigurationDefinitionModalNamespaceField()
      .shadow()
      .find('input')
      .clear({ force: true })
      .type(namespace, { delay: 100, force: true });
    configurationObj
      .addConfigurationDefinitionModalNameField()
      .shadow()
      .find('input')
      .clear({ force: true })
      .type(name, { delay: 50, force: true });
    configurationObj
      .addConfigurationDefinitionModalDescField()
      .shadow()
      .find('textarea')
      .clear({ force: true })
      .type(desc, { force: true });
  }
);

When('the user clicks Save button in configuration definition modal', function () {
  configurationObj.configurationDefinitionModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(2000); // Wait for the record to save and show in the grid
});

When('the user clicks Cancel button in configuration definition modal', function () {
  configurationObj.configurationDefinitionModalCancelBtn().shadow().find('button').click({ force: true });
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
        configurationObj
          .configurationDefinitionEditBtn(namespace, name, desc)
          .shadow()
          .find('button')
          .click({ force: true });
        break;
      case 'delete':
        configurationObj
          .configurationDefinitionDeleteBtn(namespace, name, desc)
          .shadow()
          .find('button')
          .click({ force: true });
        break;
      case 'eye':
        configurationObj
          .configurationDefinitionEyeBtn(namespace, name, desc)
          .invoke('attr', 'icon')
          .then((iconValue) => {
            if (iconValue == 'eye') {
              configurationObj
                .configurationDefinitionEyeBtn(namespace, name, desc)
                .shadow()
                .find('button')
                .click({ force: true });
              cy.wait(1000);
              configurationObj
                .configurationDefinitionEyeBtn(namespace, name, desc)
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

Then('the user views Edit definition modal', function () {
  configurationObj.configurationDefinitionModalTitle().invoke('text').should('eq', 'Edit definition');
});

Then('the user views disabled namespace and name fields in configuration definition modal', function () {
  configurationObj.addConfigurationDefinitionModalNamespaceField().shadow().find('input').should('be.disabled');
  configurationObj.addConfigurationDefinitionModalNameField().shadow().find('input').should('be.disabled');
});

When('the user enters {string} in description in configuration definition modal', function (desc) {
  configurationObj
    .addConfigurationDefinitionModalDescField()
    .shadow()
    .find('textarea')
    .clear({ force: true })
    .type(desc, { force: true });
});

//Asterisk inside payload will be replaced to a random number to introduce some randomness to the test data
When('the user enters {string} in payload schema in configuration definition modal', function (payload) {
  cy.wait(1000); // Wait for the schema field to be editable
  // Replace * inside the payload to a random number
  const payloadWithoutAsterisk = payload.replace(/\*/g, randomNumber.toString()); // replace * to a random number

  // Clearing schema field doesn't always work. Try 3 times of clearing before entering user data
  for (let j = 0; j < 3; j++) {
    configurationObj
      .configurationDefinitionModalPayloadEditor()
      .click({ force: true })
      .focus()
      .type('{ctrl}a', { force: true })
      .wait(1000)
      .clear({ force: true });
  }
  cy.wait(1000);
  configurationObj
    .configurationDefinitionModalPayloadEditor()
    .click({ force: true })
    .focus()
    .type(payloadWithoutAsterisk, { force: true, parseSpecialCharSequences: false });
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

Given('a tenant admin user is on configuration revisions page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Configuration', 4000);
  commonObj.serviceTab('Configuration', 'Revisions').click();
  cy.wait(3000);
});

When('the user selects {string} from select definition dropdown', function (definition) {
  configurationObj.selectDefinitionDropdown().shadow().find('input').click({ force: true });
  configurationObj.selectDefinitionDropdown().shadow().find('li').contains(definition).click({ force: true });
  cy.wait(1000);
});

Then('the user views a list of configuration revisions with a latest revision', function () {
  configurationObj.revisionTableWithHeaderTitles().should('be.visible');
  configurationObj.revisionTableLatestBadge().should('be.visible');
});

When('the user clicks add revision icon of the latest revision', function () {
  configurationObj.revisionTableAddIconForLatestRevision().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views the revision creation confirmation modal for {string}', function (definition) {
  configurationObj.revisionCreationConfirmationModalHeading().should('contain', 'Create a revision for ' + definition);
});

When('the user clicks Create button in the revision creation confirmation modal', function () {
  configurationObj.revisionCreationConfirmationModalCreateButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views a new revision is created with the current timestamp', function () {
  configurationObj
    .revisionTableLatestRevisionDate()
    .invoke('text')
    .then((revDateTimeString) => {
      const revDateTimeStringArray = revDateTimeString.split('at');
      const revDate = revDateTimeStringArray[0].trim();
      const revTime = revDateTimeStringArray[1].trim();
      const revDateTime = new Date(revDate + ', ' + revTime);
      Cypress.log({
        name: 'Revision time : ',
        message: revDateTime.toLocaleString(),
      });
      const nowDateTime = new Date();
      Cypress.log({
        name: 'Current time : ',
        message: nowDateTime.toLocaleString(),
      });
      const millisecondDifference = nowDateTime.getTime() - revDateTime.getTime();
      expect(millisecondDifference).to.be.lt(90000); // Revision time is less than 90 seconds ago
    });
});

Then('the user views the details of the latest revision and the second last revision are the same', function () {
  // Get latest details
  let latestRevDetails, previousRevDetails;
  configurationObj
    .revisionTableLatestRevisionNumber()
    .invoke('text')
    .then((revNumberString) => {
      const latestRevNumber = Number(revNumberString);
      configurationObj
        .revisionTableEyeIcon(latestRevNumber)
        .shadow()
        .find('button')
        .scrollIntoView()
        .click({ force: true })
        .then(() => {
          configurationObj
            .revisionTableRevisionDetails()
            .invoke('text')
            .then((revDetails) => {
              latestRevDetails = revDetails;
            });
          configurationObj
            .revisionTableEyeOffIcon(latestRevNumber)
            .shadow()
            .find('button')
            .scrollIntoView()
            .click({ force: true });
        })
        .then(() => {
          // Get the 2nd last revision details
          const previousRevNumber = Number(revNumberString) - 1;
          Cypress.log({
            name: 'The second last revision number : ',
            message: previousRevNumber,
          });
          configurationObj
            .revisionTableEyeIcon(previousRevNumber)
            .shadow()
            .find('button')
            .scrollIntoView()
            .click({ force: true })
            .then(() => {
              configurationObj
                .revisionTableRevisionDetails()
                .invoke('text')
                .then((revDetails) => {
                  previousRevDetails = revDetails;
                });
              configurationObj
                .revisionTableEyeOffIcon(previousRevNumber)
                .shadow()
                .find('button')
                .scrollIntoView()
                .click({ force: true });
            });
        });
    });
  // Compare details
  expect(latestRevDetails).to.eq(previousRevDetails);
});

When('the user clicks {string} icon for the latest revision', function (button) {
  switch (button) {
    case 'edit':
      configurationObj.revisionTableEditButton().shadow().find('button').click({ force: true });
      cy.wait(1000);
      break;
    case 'eye':
      configurationObj
        .revisionTableLatestRevisionNumber()
        .invoke('text')
        .then((revNumberString) => {
          const latestRevNumber = Number(revNumberString);
          configurationObj
            .revisionTableEyeIcon(latestRevNumber)
            .shadow()
            .find('button')
            .scrollIntoView()
            .click({ force: true });
          cy.wait(2000);
        });
      break;
    default:
      expect(button).to.be.oneOf(['edit', 'eye']);
  }
});

Then('the user views Edit revision modal for {string}', function (definition) {
  configurationObj.revisionTableEditRevisionModalTitle().should('contain', 'Edit Revision for ' + definition);
});

Then('the user views the error message of {string}', function (errorMsg) {
  cy.wait(1000); // Wait for error message to show
  configurationObj.revisionTableEditRevisionModalFormItem().invoke('attr', 'error').should('contain', errorMsg);
});

Then('the save button in Edit revision modal is disabled', function () {
  configurationObj.revisionTableEditRevisionModalSaveButton().invoke('attr', 'disabled').should('eq', 'disabled');
});

When('the user clicks Save button in Edit revision modal', function () {
  configurationObj.revisionTableEditRevisionModalSaveButton().shadow().find('button').click({ force: true });
});

//Asterisk inside payload will be replaced to a random number to introduce some randomness to the test data
Then('the user views {string} for the latest revision', function (jsonText) {
  // Replace * inside the json text to a random number
  const jsonTextWithoutAsterisk = jsonText.replace(/\*/g, randomNumber.toString()); // replace * to a random number

  // Check eye off icon is showing for the latest revision before checking details
  configurationObj
    .revisionTableLatestRevisionNumber()
    .invoke('text')
    .then((revNumberString) => {
      const latestRevNumber = Number(revNumberString);
      configurationObj
        .revisionTableEyeOffIcon(latestRevNumber)
        .should('be.visible')
        .then(() => {
          configurationObj
            .revisionTableRevisionDetails()
            .invoke('text')
            .then((revDetails) => {
              expect(
                revDetails
                  .replace(/\s+/g, ' ') // replace multiple whitespaces with one whitespace
                  .replace(/(\r\n|\n|\r)/gm, '') // remove line breakers
                  .replace(/{\s/g, '{') // remove whitespace after {
                  .replace(/\s}/g, '}') // remove whitespace before }
              ).to.eq(jsonTextWithoutAsterisk);
            });
        });
    });
});

When('the user clicks power icon on the second last revision', function () {
  configurationObj
    .revisionTableLatestRevisionNumber()
    .invoke('text')
    .then((revNumberString) => {
      const previousRevNumber = Number(revNumberString) - 1;
      Cypress.log({
        name: 'The second last revision number : ',
        message: previousRevNumber,
      });
      configurationObj.revisionTablePowerIcon(previousRevNumber).shadow().find('button').click({ force: true });
    });
});

Then(
  'the user views set active revision confirmation modal for the second last revision of {string}',
  function (configuration) {
    configurationObj
      .revisionTableLatestRevisionNumber()
      .invoke('text')
      .then((revNumberString) => {
        const previousRevNumber = Number(revNumberString) - 1;
        Cypress.log({
          name: 'The second last revision number : ',
          message: previousRevNumber,
        });
        configurationObj
          .revisionTableSetActiveRevisionModalHeading()
          .invoke('text')
          .should('contain', 'Set active revision for ' + configuration + ' revision ' + previousRevNumber.toString());
      });
  }
);

When('the user click Set Active button in set active revision confirmation modal', function () {
  configurationObj.revisionTableSetActiveRevisionModalSetActiveButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views the active label on the second last revision', function () {
  configurationObj
    .revisionTableLatestRevisionNumber()
    .invoke('text')
    .then((latestRevNumberString) => {
      const previousRevNumber = Number(latestRevNumberString) - 1;
      Cypress.log({
        name: 'The second last revision number : ',
        message: previousRevNumber,
      });
      configurationObj
        .revisionTableActiveRevisionNumberBadge()
        .invoke('text')
        .should('eq', previousRevNumber.toString());
    });
});

Then('the user should not view power icon on the active revision', function () {
  configurationObj
    .revisionTableActiveRevisionNumberBadge()
    .invoke('text')
    .then((activeRevNumberString) => {
      configurationObj.revisionTablePowerIcon(activeRevNumberString).should('not.exist');
    });
});

When('the user clicks Load more button on configuration service revisions page', function () {
  configurationObj.revisionTableLoadMoreButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views more than ten revision records', function () {
  configurationObj.revisionTableRevisionRows().should('have.length.above', 10);
});

Then('the user views {string} in payload schema in configuration definition modal', function (schema) {
  let jsonSchemaInEdit = '';
  configurationObj
    .revisionTableEditRevisionModalPayloadEditorRows()
    .find('span')
    .then((spanElements) => {
      for (let i = 0; i < spanElements.length; i++) {
        jsonSchemaInEdit = jsonSchemaInEdit + spanElements[i].outerText.replace(/\u00A0/g, ''); // Grab all texts and remove line breakers
      }
    })
    .then(() => {
      expect(jsonSchemaInEdit.replace(/[0-9]/g, '')).to.eq(schema.replace(/ /g, '').replace(/\*/g, ''));
    });
});

Then(
  'the user views {string} configuration schema to include property for the securityClassification',
  function (definitionName) {
    configurationObj
      .configurationSchemaDetails(definitionName)
      .invoke('text')
      .should(
        'contains',
        '"securityClassification": {\n      "type": "string",\n      "enum": [\n        "public",\n        "protected a",\n        "protected b",\n        "protected c"\n      ],\n      "default": "protected a"\n    }'
      );
  }
);
