import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import BuilderAppPage from './builder-app.page';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

const page = new BuilderAppPage();

When('the user visits the builder app root', function () {
  cy.visit('/');
  cy.wait(2000);
});

Then('the user views the builder app landing page', function () {
  page.landingHeading().should('exist');
});

When('the user navigates to the builder login page for realm {string}', function (realm: string) {
  cy.visit(`/${realm}/login`);
  cy.wait(2000);
});

Then('the user views the Keycloak login form', function () {
  page.usernameField().should('exist');
  page.passwordField().should('exist');
  page.loginButton().should('exist');
});

Then('no critical or serious accessibility issues on {string} page', function (pageName: string) {
  injectAxe();
  cy.checkA11y(
    null!,
    {},
    (violations) => {
      htmlReport(violations, true, pageName + '-all');
    },
    true
  );
  cy.checkA11y(null!, { includedImpacts: ['critical', 'serious'] }, (violations) => {
    htmlReport(violations, true, pageName + '-critical&serious');
  });
});
