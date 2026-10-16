import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer sends a request to list task queues', function () {
  cy.request({
    method: 'GET',
    url: '/task/v1/queues',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with a queues list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.be.an('array');
});

When('a developer sends a request to create a task in namespace {string} queue {string}', function (namespace: string, name: string) {
  cy.request({
    method: 'POST',
    url: `/task/v1/queues/${namespace}/${name}/tasks`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    body: {
      name: 'E2E regression test task',
      description: 'Created by e2e regression suite',
      priority: 'Normal',
    },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response or 404 response is returned for the task creation request', function () {
  expect(responseObj.status).to.be.oneOf([200, 404]);
});

When('a developer sends a request to list all tasks', function () {
  cy.request({
    method: 'GET',
    url: '/task/v1/tasks',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with a tasks list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('results');
});
