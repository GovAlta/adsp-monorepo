import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import StatusAppPage from './status-app.page';

const statusAppObj = new StatusAppPage();

Given('a user is on the public service status page for {string}', function (tenant) {
  const urlToTenantLogin = Cypress.env().statusAppUrl + '/' + tenant;
  cy.visit(urlToTenantLogin);
  cy.wait(3000);
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

Then('the user views the timestamp of {string} being updated', function (appName) {
  const localTimeString = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  statusAppObj
    .applicationStatusUpdatedTimestamp(appName)
    .invoke('text')
    .then((text) => {
      expect(text).to.contain(localTimeString);
    });
});

Then('the user views the status of {string} being the first unused status', function (appName) {
  statusAppObj
    .applicationStatus(appName.trim())
    .invoke('text')
    .then((text) => {
      // expect(text.toLowerCase()).to.equal(newStatus.toLowerCase());
      cy.task('getNewAppStatus').then((appStatus) => {
        expect(text.toLowerCase()).to.equal(appStatus);
      });
    });
});
