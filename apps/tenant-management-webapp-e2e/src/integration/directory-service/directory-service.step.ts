import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import DirectoryServicePage from './directory-service.page';

const statusObj = new DirectoryServicePage();

Then('the user views the Directory service overview content {string}', function (paragraphText) {
  statusObj.directoryOverviewContent().invoke('text').should('contain', paragraphText);
});

Then('the user views the Overview aside item {string}', function (listitem) {
  statusObj.directoryAsideItem(listitem).should('exist');
});

Then('the user views the Overview aside item with link {string}', function (listitem) {
  statusObj.directoryAsideItem(listitem).should('have.attr', 'href');
});

Then('the user views the service entry of {string} and {string}', function (directoryName, fileUrl) {
  let url = '';
  const envFileApi = fileUrl.match(/(?<={).+(?=})/g);
  if (envFileApi == '') {
    url = fileUrl;
  } else {
    url = Cypress.env(String(envFileApi));
  }
  statusObj.directoryTable().contains('td', directoryName).siblings().contains(url);
});
