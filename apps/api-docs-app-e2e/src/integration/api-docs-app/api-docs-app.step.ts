import { When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj: Cypress.Response<any>;

When('a developer sends a request to the API documentation app root', function () {
  cy.request({
    method: 'GET',
    url: '/',
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned with the swagger UI page', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.headers['content-type']).to.include('html');
});

When('a developer sends a request to platform service docs for {string}', function (service: string) {
  cy.request({
    method: 'GET',
    url: `/docs/platform/${service}`,
    failOnStatusCode: false,
  }).then((response) => {
    responseObj = response;
  });
});

Then('a 200 response is returned for the service documentation', function () {
  expect(responseObj.status).to.eq(200);
});
