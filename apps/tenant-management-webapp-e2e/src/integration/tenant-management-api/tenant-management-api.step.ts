import { When, Then } from 'cypress-cucumber-preprocessor/steps';

let responseObj;

When(
  'the user sends a request to tenant management health endpoint',
  function () {
    cy.request(
      'GET',
      'https://tenant-management-api-core-services-dev.os99.gov.ab.ca/health'
    ).then(function (response) {
      responseObj = response;
    });
  }
);

Then('the user receives response with application uptime', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body, 'response body').to.have.property('uptime');
});
