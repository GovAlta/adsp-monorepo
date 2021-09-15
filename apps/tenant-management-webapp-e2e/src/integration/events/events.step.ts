import { Then } from 'cypress-cucumber-preprocessor/steps';
import events from './events.page';

const eventsObj = new events();

Then('the user views events overview page', function () {
  eventsObj.eventsOverviewh3Title().invoke('text').should('contain', 'Event Definitions');
});
