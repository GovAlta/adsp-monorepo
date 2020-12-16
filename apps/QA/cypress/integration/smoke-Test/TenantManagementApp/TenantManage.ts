/// <reference types="cypress" />
import {
  Before,
  After,
  Given,
  When,
  Then,
} from 'cypress-cucumber-preprocessor/steps';
//declare const Given, When, Then;

Given(/^I am a user$/, () => {
  expect(1).to.eq(1);
});

When(/^I do something$/, () => {
  expect(1).to.eq(1);
});

Then(/^I get something$/, () => {
  cy.request(
    'GET',
    'https://tenant-management-api-core-services-dev.os99.gov.ab.ca/health'
  ).then(function (response) {
    expect(response.status).to.eq(200);
    expect(response.body, 'response body').to.have.property('uptime');
  });
});
