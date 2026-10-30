import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer sends a request to list agents', function () {
  cy.request({
    method: 'GET',
    url: '/agent/v1/agents',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with an agents list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('agents').that.is.an('array');
  responseObj.body.agents.forEach((agent: { id: string; name: string }) => {
    expect(agent.id).to.be.a('string');
    expect(agent.name).to.be.a('string');
  });
});

When('a developer sends an unauthenticated request to list agents', function () {
  cy.request({
    method: 'GET',
    url: '/agent/v1/agents',
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 401 response is returned', function () {
  expect(responseObj.status).to.eq(401);
});

When('a developer sends a request to get agent details for {string}', function (agentId: string) {
  cy.request({
    method: 'GET',
    url: `/agent/v1/agents/${agentId}`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with the agent details', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('id');
  expect(responseObj.body).to.have.property('name');
});

When(
  'a developer sends a message to agent {string} with content {string}',
  function (agentId: string, content: string) {
    cy.request({
      method: 'POST',
      url: `/agent/v1/agents/${agentId}`,
      auth: { bearer: Cypress.env('autotest-admin-token') },
      body: { content },
      failOnStatusCode: false,
    }).then((response) => {
      responseObj = response;
    });
  }
);

Then('a 200 response is returned with agent message content', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('content').that.is.not.empty;
});
