import { Then } from 'cypress-cucumber-preprocessor/steps';
import ConfigurationServicePage from './configuration-service.page';

const configurationObj = new ConfigurationServicePage();

Then('the user views the Configuration service overview content {string}', function (paragraphText) {
  configurationObj.configurationOverviewContent().invoke('text').should('contain', paragraphText);
});

Then('the user views the link for Configuration service under {string} as {string}', function (asideItem, asideLink) {
  configurationObj.configurationSupportLink(asideItem, asideLink).should('have.attr', 'href');
});
