import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer sends a request to get daily metrics', function () {
  const today = new Date().toISOString().split('T')[0];
  cy.request({
    method: 'GET',
    url: `/api/metrics/v1/metrics/${today}`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with metrics data', function () {
  expect(responseObj.status).to.eq(200);
});
