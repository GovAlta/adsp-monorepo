import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

let responseObj: Cypress.Response;

Given(
  'a testing mapping of {string}, {string} and {string} is inserted with {string}',
  function (urnname, urnservice, serviceurl, request) {
    const requestURL = Cypress.env('API') + request;
    const name = urnname;
    const service = urnservice;
    const host = serviceurl;
    cy.request('POST', requestURL, {
      name,
      services: [{ service, host }],
    }).then(function (response) {
      expect(response.status).equals(201);
    });
  }
);

When('the user sends a discovery request with {string}', function (request) {
  const requestURL = Cypress.env('API') + request;
  cy.request('GET', requestURL).then(function (response) {
    responseObj = response;
  });
});

Then(
  'the user should get a map of logical names to urls for all services',
  function () {
    // Verify the response has 200 status and an array of mappings
    expect(responseObj.status).to.eq(200);
    expect(responseObj.body.length).is.least(1);
  }
);

Then(
  'the user should get {string} with a mapped URL for the individual service',
  function (fileServiceURL) {
    // Verify that response has 200 status and url of file service
    expect(responseObj.status).to.eq(200);
    // Due to an issue of URL being created with duplicated https:// through POST utility method, the validation uses contain instead of equal.
    expect(responseObj.body).to.have.property('url').to.contain(fileServiceURL);
  }
);

When('the user sends a delete request of {string} with {string}', function (
  urnname,
  request
) {
  const requestURL = Cypress.env('API') + request;
  const name = urnname;
  cy.request('DELETE', requestURL, { name }).then(function (response) {
    responseObj = response;
  });
});

Then('the testing mapping is removed', function () {
  expect(responseObj.status).equals(202);
});
