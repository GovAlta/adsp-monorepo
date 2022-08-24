import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import StatusAppPage from './status-app.page';

const statusAppObj = new StatusAppPage();

Given('a user is on the public service status page for {string}', function (tenant) {
  if (tenant == 'Platform') {
    cy.visit('/');
  } else {
    cy.visit('/' + tenant);
  }
  cy.wait(2000); // Wait all the redirects to settle down
});

Then(
  'the user should be able to view {string} as support email in the status app for {string} tenant',
  function (email, tenant) {
    const urlToTenantLogin = Cypress.env().statusAppUrl + '/' + tenant;
    cy.visit(urlToTenantLogin);
    cy.wait(3000);
    statusAppObj.statusNotificationPageTitle().should('contain', tenant, { matchCase: false });
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
  }
);

Then('the user views the timestamp of {string} being updated', function (appName) {});
