import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import commonlib from '../common/common-library';
import CachePage from './cache.page';

const cacheObj = new CachePage();

Then('the user views {string} section on cache overview page', function (sectionName) {
  cacheObj.cacheOverviewTab().should('exist');
  cacheObj
    .cacheOverviewCachetargetsContent(sectionName)
    .invoke('text')
    .should(
      'contain',
      'Targets are upstream services and APIs that cache service can provide read-through requests to. This configuration is'
    );
});

Given('a tenant admin user is on cache overview page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Cache', 4000);
});

When('the user clicks Add cache target button on overview tab', function () {
  cacheObj.addCacheTargetOverviewTabBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks Add cache target button', function () {
  cacheObj.addCacheTargetBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views Add target modal', function () {
  cacheObj.addTargetModalTitle().invoke('text').should('eq', 'Add target');
});

When('the user clicks Save button in Add target modal', function () {
  cacheObj.targetModalSaveButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

When('the user clicks Cancel button in Add target modal', function () {
  cacheObj.targetModalCancelButton().shadow().find('button').click({ force: true });
});

Then('the user views target table header on targets page', function () {
  cacheObj.targetTableHeader().should('be.visible');
});

Then('the user views {string} as the default value for TTL in Add target modal', function (secondNumber) {
  cacheObj.targetModalTtlField().invoke('attr', 'value').should('eq', secondNumber);
});

Then('the user views {string} as TTL unit in Add target modal', function (unitString) {
  cacheObj.targetModalTtlFieldTrailingContent().invoke('text').should('eq', unitString);
});
