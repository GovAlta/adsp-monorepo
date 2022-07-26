import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import StatusAppPage from './status-app.page';

const statusAppObj = new StatusAppPage();

Then('the public status app displays {string} as support email', function (email) {
  cy.visit('statusAppUrl');
  cy.wait(3000);
  statusAppObj
    .statusNotificationPleaseContact()
    .should('have.attr', 'href')
    .then((href) => {
      expect(href).to.contain(email);
    });
  statusAppObj
    .statusNotificationSignupDescription()
    .should('have.attr', 'href')
    .then((href) => {
      expect(href).to.contain(email);
    });
});
