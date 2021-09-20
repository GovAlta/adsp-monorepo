import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import events from './events.page';

const eventsObj = new events();

Then('the user views events overview page', function () {
  eventsObj.eventsOverviewh3Title().invoke('text').should('contain', 'Event Definitions');
});

Then('the user views an event definition of {string} under {string}', function (eventName, eventNamespace) {
  eventsObj.event(eventNamespace, eventName).should('exist');
});

When(
  'the user clicks {string} details button for the definition of {string} under {string}',
  function (showHide, eventName, eventNamespace) {
    switch (showHide) {
      case 'show':
        eventsObj.showDetailsIcon(eventNamespace, eventName).click();
        break;
      case 'hide':
        eventsObj.hideDetailsIcon(eventNamespace, eventName).click();
        break;
      default:
        expect(showHide).to.be.oneOf(['show', 'hide']);
    }
  }
);

Then(
  'the user {string} the definition details of {string} under {string}',
  function (viewOrNot, eventName, eventNamespace) {
    switch (viewOrNot) {
      case 'views':
        eventsObj.eventDetails(eventNamespace, eventName).should('exist');
        break;
      case 'should not view':
        eventsObj.eventDetails(eventNamespace, eventName).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  }
);
