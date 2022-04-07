import { Given, Then, And } from 'cypress-cucumber-preprocessor/steps';
import ServiceStatusPage from './status-notice.page';
const statusNoticeObj = new ServiceStatusPage();
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

Given('a user is on the public service status page for {string}', function (tenant) {
  if (tenant == 'Platform') {
    cy.visit('/');
  } else {
    cy.visit('/' + tenant);
  }
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

Then('the user views service statuses for {string}', function (serviceList) {
  const services = serviceList.split(',');
  services.forEach((serviceName) => {
    // Check each service has its status
    statusNoticeObj
      .applicationStatus(serviceName.trim())
      .invoke('text')
      .then((text) => {
        Cypress.log({
          name: 'Service status for "' + serviceName + '": ',
          message: text,
        });
        expect(text).to.not.be.null;
        expect(text.length).to.be.greaterThan(0);
      });
  });
});

Then('no critical or serious accessibility issues on public service status page', function () {
  injectAxe();
  // check all accessibility issues and generate a report without failing the step.
  cy.checkA11y(
    null!,
    {},
    (violations) => {
      htmlReport(violations, true, 'public service status page' + '-all');
    },
    true
  );
  // check critical and serious accessibility issues and generate a report. Fail the step if there are any.
  cy.checkA11y(null!, { includedImpacts: ['critical', 'serious'] }, (violations) => {
    htmlReport(violations, true, 'public service status page' + '-critical&serious');
  });
});

And('the user views the timezone information', function () {
  statusNoticeObj
    .timezoneInfo()
    .invoke('text')
    .then((text) => {
      expect(text).to.match(/All times are in [a-zA-Z0-9 ]+ Time/g);
    });
});

And('the user views the all services notice of {string}', function (noticeMessage) {
  statusNoticeObj.allApplicationNoticeMessage(noticeMessage).should('exist');
});
