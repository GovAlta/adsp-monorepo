import { When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;

When('a developer sends a request to get audit actions for namespace {string}', function (namespace: string) {
  cy.request({
    method: 'GET',
    url: `/audit/v1/${namespace}/actions`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with an actions list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.be.an('array').that.is.not.empty;
});

When(
  'a developer sends a request to write an audit event for namespace {string} with action {string}',
  function (namespace: string, action: string) {
    cy.request({
      method: 'POST',
      url: `/audit/v1/${namespace}/events`,
      auth: { bearer: Cypress.env('autotest-admin-token') },
      body: { name: action, details: { test: true, source: 'e2e-regression' } },
      failOnStatusCode: false,
    }).then((response) => {
      responseObj = response;
    });
  }
);

Then('a 202 response is returned with accepted count for the audit event write', function () {
  expect(responseObj.status).to.eq(202);
  expect(responseObj.body).to.have.property('accepted');
  expect(responseObj.body.accepted).to.be.greaterThan(0);
});
