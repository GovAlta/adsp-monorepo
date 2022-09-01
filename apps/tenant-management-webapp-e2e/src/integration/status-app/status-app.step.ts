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
  statusAppObj
    .applicationStatusUpdatedTimestamp(appName)
    .invoke('text')
    .then((text) => {
      expect(text).to.contain('Today');
      expect(text).to.match(/[0-9]{1,2}:[0-9]{2} [A|P]M/);
    });
});

Then('the user views the status of {string} being the first unused status', function (appName) {
  statusAppObj
    .applicationStatus(appName.trim())
    .invoke('text')
    .then((text) => {
      cy.task('getNewAppStatus').then((appStatus) => {
        expect(text.toLowerCase()).to.equal(appStatus);
      });
    });
});
