/// <reference types="cypress" />
import {
  Before,
  After,
  Given,
  When,
  Then,
} from 'cypress-cucumber-preprocessor/steps';

Given(/^I am a user$/, () => {});

When(/^I do something$/, () => {});

Then(/^I get something$/, () => {
  cy.request(
    'GET',
    'https://tenant-management-api-core-services-dev.os99.gov.ab.ca/health'
  ).then(function (response) {
    expect(response.status).to.eq(200);
    expect(response.body, 'response body').to.have.property('uptime');
  });
});
