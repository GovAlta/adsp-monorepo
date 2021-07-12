import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import events from './events.page';

const eventsObj = new events();

When('the user selects {string} tab', function (tab) {
  eventsObj.eventTab(tab).click();
  cy.wait(2000);
});

Then('the user views events overview page', function () {
  eventsObj.eventsOverviewTitle().invoke('text').should('contain', 'Event Definitions');
});

Then('the user views the events documentation', function () {
  eventsObj.eventsDocumentationEventServiceTitle().then((title) => {
    expect(title.length).to.be.gt(0); // element exists
  });
});
