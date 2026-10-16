import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer sends a request to list push service streams', function () {
  cy.request({
    method: 'GET',
    url: '/stream/v1/streams',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with a streams list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('results');
});

When('a developer sends an unauthenticated request to list push service streams', function () {
  cy.request({
    method: 'GET',
    url: '/stream/v1/streams',
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 401 response is returned', function () {
  expect(responseObj.status).to.eq(401);
});

When('a developer sends a request to get push stream details for {string}', function (streamId: string) {
  cy.request({
    method: 'GET',
    url: `/stream/v1/streams/${streamId}`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response or 404 response is returned for the stream details request', function () {
  expect(responseObj.status).to.be.oneOf([200, 404]);
});
