import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;
let firstClientId: string;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer sends a request to list token handler clients', function () {
  cy.request({
    method: 'GET',
    url: '/token-handler/v1/clients',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with a clients list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.be.an('array');
});

When('a developer sends an unauthenticated request to list token handler clients', function () {
  cy.request({
    method: 'GET',
    url: '/token-handler/v1/clients',
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 401 response is returned', function () {
  expect(responseObj.status).to.eq(401);
});

When('a developer retrieves the first registered token handler client', function () {
  cy.request({
    method: 'GET',
    url: '/token-handler/v1/clients',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((listResponse) => {
    expect(listResponse.status).to.eq(200);
    expect(listResponse.body).to.be.an('array').and.have.length.greaterThan(0);
    firstClientId = listResponse.body[0].id;

    cy.request({
      method: 'GET',
      url: `/token-handler/v1/clients/${firstClientId}`,
      auth: { bearer: Cypress.env('autotest-admin-token') },
      failOnStatusCode: false,
    }).then((response) => {
      responseObj = response;
    });
  });
});

Then('a 200 response is returned with the client details', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('id');
});
