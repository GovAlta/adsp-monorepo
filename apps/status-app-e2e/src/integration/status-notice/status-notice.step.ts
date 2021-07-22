import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import ServiceStatusPage from './status-notice.page';
const statusNoticeObj = new ServiceStatusPage();
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

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
