import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;
let createdFormId: string | null = null;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer sends a request to list form definitions', function () {
  cy.request({
    method: 'GET',
    url: '/form/v1/definitions',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with a definitions list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('results');
});

When('a developer sends a request to create a form from definition {string}', function (definitionId: string) {
  cy.request({
    method: 'POST',
    url: '/form/v1/forms',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    body: { definitionId, data: {}, files: {} },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
    if (response.status === 200 && response.body?.id) {
      createdFormId = response.body.id;
    }
  });
});

Then('a 200 response or 404 response is returned for the form creation request', function () {
  expect(responseObj.status).to.be.oneOf([200, 404]);
});

When('a developer sends a request to list forms', function () {
  cy.request({
    method: 'GET',
    url: '/form/v1/forms',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with a forms list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('results');
});
