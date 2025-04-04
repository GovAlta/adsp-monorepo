import { When, Then } from '@badeball/cypress-cucumber-preprocessor';

let responseObj;

When('the user sends a request to tenant management health endpoint', function () {
  const requestURL = Cypress.env('tenantManagementApi') + '/health';
  cy.request('GET', requestURL).then(function (response) {
    responseObj = response;
  });
});

Then('the user receives response with application uptime', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body, 'response body').to.have.property('uptime');
});
