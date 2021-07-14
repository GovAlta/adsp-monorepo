import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import ServiceStatusPage from './status-notice.page';
const statusNoticeObj = new ServiceStatusPage();

Given('a user is on the public service status page', function () {
  cy.visit('/');
  cy.wait(2000); // Wait all the redirects to settle down
});

Then('the user views the status and outages page', function () {
  statusNoticeObj.statusPageTitle().invoke('text').should('contain', 'Status');
});

Then('the user views the correct header and release version', function () {
  statusNoticeObj.goaOfficialSiteHeader().then((header) => {
    expect(header.length).to.be.gt(0); // element exists
  });
  statusNoticeObj.goaMicrositeHeader().then((header) => {
    expect(header.length).to.be.gt(0); // element exists
  });
});
