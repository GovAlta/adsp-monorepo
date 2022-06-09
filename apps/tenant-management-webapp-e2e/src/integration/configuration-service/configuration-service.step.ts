import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import ConfigurationServicePage from './configuration-service.page';

const configurationObj = new ConfigurationServicePage();

Then('the user views the Configuration service overview content {string}', function (paragraphText) {
  configurationObj.configurationOverviewContent().invoke('text').should('contain', paragraphText);
});

Then('the user views a heading of {string} namespace', function (namespace) {
  configurationObj.definitionTitle(namespace).invoke('text').should('contain', namespace);
});

Then('the user views a {string} under core-service configurations', function (definitionName) {
  configurationObj.coreDefinitionsTable().invoke('text').should('contain', definitionName);
});

When('the user clicks eye icon of {string} under Platform to view the schema', function (definitionName) {
  configurationObj.configurationDetailsIcon(definitionName).click();
});

Then('the user views the schema of file-service', function () {
  configurationObj.configurationSchemaDetails().should('be.visible');
});

When('the user clicks eye icon of {string} under Platform to close the schema', function (definitionName) {
  configurationObj.configurationHideDetailsIcon(definitionName).click();
});
