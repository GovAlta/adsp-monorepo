import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;
let generatedCode: string;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer sends a generate code request for key {string}', function (key: string) {
  cy.request({
    method: 'POST',
    url: `/verify/v1/codes/${key}`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with a generated verification code', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('code');
});

When('a developer generates and verifies a code for key {string}', function (key: string) {
  cy.request({
    method: 'POST',
    url: `/verify/v1/codes/${key}`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((genResponse) => {
    generatedCode = genResponse.body.code;
    cy.request({
      method: 'POST',
      url: `/verify/v1/codes/${key}`,
      auth: { bearer: Cypress.env('autotest-admin-token') },
      body: { code: generatedCode },
      failOnStatusCode: false,
    }).then((verifyResponse) => {
      responseObj = verifyResponse;
    });
  });
});

Then('the verification response returns verified as {string}', function (expected: string) {
  expect(responseObj.status).to.eq(200);
  expect(String(responseObj.body.verified)).to.eq(expected);
});

When('a developer generates a code for key {string}', function (key: string) {
  cy.request({
    method: 'POST',
    url: `/verify/v1/codes/${key}`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    generatedCode = response.body.code;
  });
});

When('a developer verifies key {string} with code {string}', function (key: string, code: string) {
  cy.request({
    method: 'POST',
    url: `/verify/v1/codes/${key}`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    body: { code },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});
