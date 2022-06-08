import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import ConfigurationServicePage from './configuration-service.page';

const configurationObj = new ConfigurationServicePage();

Then('the user views the Configuration service overview content {string}', function (paragraphText) {
  configurationObj.configurationOverviewContent().invoke('text').should('contain', paragraphText);
});

Then('the user views a heading of {string} namespace', function (namespace) {
  configurationObj.definitionTitle(namespace).invoke('text').should('contain', namespace);
});

Then('the user views a list of core-service configurations', function () {
  configurationObj.coreDefinitionsTable().find('tr').its('length').should('be.gte', 1);
});

When('the user clicks eye icon of {string} under Platform', function (platformName) {
  configurationObj.definitionsToggleButton(platformName).click();
});

Then('the user views the schema of "file-service" configuration', function () {
  configurationObj.definitionsDetails().should('exist');
});
