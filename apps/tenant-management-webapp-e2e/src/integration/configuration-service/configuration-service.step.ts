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

Then('the user {string} the schema of file-service', function (viewOrNot) {
  switch (viewOrNot) {
    case 'views':
      configurationObj.configurationSchemaDetails().should('not.empty');
      break;
    case 'should not view':
      configurationObj.configurationSchemaDetails().should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

When('the user validate partial content {string} of file service schema', function (content) {
  configurationObj.configurationSchemaDetails().invoke('text').should('contain', content);
});
