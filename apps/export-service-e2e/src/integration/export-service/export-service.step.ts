import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;
let jobId: string;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer submits an export job for {string} as {string}', function (resourceId: string, format: string) {
  cy.request({
    method: 'POST',
    url: '/export/v1/jobs',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    body: { resourceId, format },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
    if (response.body && response.body.id) {
      jobId = response.body.id;
    }
  });
});

Then('a 200 response is returned with an export job id', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('id');
  jobId = responseObj.body.id;
});

When('a developer retrieves the export job status', function () {
  cy.request({
    method: 'GET',
    url: `/export/v1/jobs/${jobId}`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with export job status', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('status');
  expect(['queued', 'processing', 'completed', 'failed']).to.include(responseObj.body.status);
});
