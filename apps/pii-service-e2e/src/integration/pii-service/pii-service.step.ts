import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer sends a request to list PII entities', function () {
  cy.request({
    method: 'GET',
    url: '/pii/v1/entities',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with entity types including {string}', function (entityType: string) {
  expect(responseObj.status).to.eq(200);
  const types = responseObj.body.map((e: any) => e.name || e.type || e);
  expect(types).to.include(entityType);
});

When('a developer sends a PII analyze request with text {string}', function (text: string) {
  cy.request({
    method: 'POST',
    url: '/pii/v1/analyze',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    body: { text, language: 'en' },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with recognized PII entities', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('results');
  expect(responseObj.body.results).to.be.an('array');
  expect(responseObj.body.results.length).to.be.greaterThan(0);
});

When('a developer sends a PII anonymize request with text {string}', function (text: string) {
  cy.request({
    method: 'POST',
    url: '/pii/v1/anonymize',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    body: { text, language: 'en' },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with anonymized text', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('text');
  expect(responseObj.body.text).to.be.a('string');
  expect(responseObj.body.text).to.not.include('test@example.com');
});
