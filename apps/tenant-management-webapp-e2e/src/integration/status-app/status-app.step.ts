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

Then(
  'the user {string} {string} application in the status app for {string} tenant',
  function (viewOrNot, appName, tenantName) {
    const urlToTenantLogin = Cypress.env().statusAppUrl + '/' + tenantName;
    cy.visit(urlToTenantLogin);
    cy.wait(3000);
    let isFound = false;
    statusAppObj
      .applicationNames()
      .then((name) => {
        for (let i = 0; i < name.length; i++) {
          if (name[i].outerHTML.includes(appName)) {
            isFound = true;
          }
        }
      })
      .then(() => {
        switch (viewOrNot) {
          case 'views':
            expect(isFound).to.eq(true);
            break;
          case 'should not view':
            expect(isFound).to.eq(false);
            break;
          default:
            expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
        }
      });
  }
);
