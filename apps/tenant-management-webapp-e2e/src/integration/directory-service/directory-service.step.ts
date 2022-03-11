import { Then } from 'cypress-cucumber-preprocessor/steps';
import DirectoryServicePage from './directory-service.page';

const directoryObj = new DirectoryServicePage();

Then('the user views the Directory service overview content {string}', function (paragraphText) {
  directoryObj.directoryOverviewContent().invoke('text').should('contain', paragraphText);
});

Then('Then the user views the aside item {string} with the aside item link {string}', function (asideItem, asideLink) {
  directoryObj.directoryAsideItems(asideItem, asideLink).should('have.attr', 'href');
});

Then('the user views the service entry of {string} and {string}', function (directoryName, fileUrl) {
  let url = '';
  const envFileApi = fileUrl.match(/(?<={).+(?=})/g);
  if (envFileApi == '') {
    url = fileUrl;
  } else {
    url = Cypress.env(String(envFileApi));
  }
  directoryObj.directoryTable().contains('td', directoryName).siblings().contains(url);
});
