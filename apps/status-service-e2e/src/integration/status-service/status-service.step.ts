import { Given, When, Then, And } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;
let createdNoticeId: string | null = null;

Given('a user has obtained an authentication token', function () {
  cy.getConfig();
  cy.postToken();
});

When('a developer sends a request to list status service applications', function () {
  cy.request({
    method: 'GET',
    url: '/status/v1/applications',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with a status applications list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('results');
});

When('a developer sends a request to list status service notices', function () {
  cy.request({
    method: 'GET',
    url: '/notice/v1/notices',
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with a notices list', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('results');
});

When('a developer creates a status service notice with message {string}', function (message: string) {
  cy.request({
    method: 'POST',
    url: '/notice/v1/notices',
    auth: { bearer: Cypress.env('autotest-admin-token') },
    body: {
      message,
      tennantServRef: [],
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      isAllApplications: false,
    },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
    if (response.status === 200 && response.body?.id) {
      createdNoticeId = response.body.id;
    }
  });
});

Then('a 200 response is returned for the notice creation', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body).to.have.property('id');
});

When('a developer deletes the created status service notice', function () {
  if (!createdNoticeId) {
    cy.log('No notice was created; skipping delete');
    return;
  }
  cy.request({
    method: 'DELETE',
    url: `/notice/v1/notices/${createdNoticeId}`,
    auth: { bearer: Cypress.env('autotest-admin-token') },
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned for the notice deletion', function () {
  if (!createdNoticeId) {
    return;
  }
  expect(responseObj.status).to.eq(200);
});
