import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import ConfigurationServicePage from './configuration-service.page';

const configurationObj = new ConfigurationServicePage();

Then('the user views the Configuration service overview content {string}', function (paragraphText) {
  configurationObj.configurationOverviewContent().invoke('text').should('contain', paragraphText);
});

Then('the user views a heading of {string} namespace', function (namespace) {
  configurationObj.namespaceTitle(namespace).invoke('text').should('contain', namespace);
});

Then('the user views a {string} under core-service configurations', function (definitionName) {
  configurationObj.configurationDefinition(definitionName).should('exist');
});

When('the user clicks eye icon of {string} under Platform to view the schema', function (definitionName) {
  configurationObj.configurationDetailsIcon(definitionName).click();
});

When('the user clicks eye-off icon of {string} under Platform to close the schema', function (definitionName) {
  configurationObj.configurationHideDetailsIcon(definitionName).click();
});

Then(
  'the user {string} of the schema for {string} and validates {string} in details',
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
