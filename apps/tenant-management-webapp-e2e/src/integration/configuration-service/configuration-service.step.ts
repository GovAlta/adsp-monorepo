import { Then } from 'cypress-cucumber-preprocessor/steps';
import ConfigurationServicePage from './configuration-service.page';

const configurationObj = new ConfigurationServicePage();

Then('the user views the Configuration service overview content {string}', function (paragraphText) {
  configurationObj.configurationOverviewContent().invoke('text').should('contain', paragraphText);
});

Then('the user views the item {string} with the aside item link {string}', function (asideItem, asideLink) {
  configurationObj.configurationAsideItems(asideItem, asideLink).should('have.attr', 'href');
});
