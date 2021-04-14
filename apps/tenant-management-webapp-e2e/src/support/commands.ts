/* eslint-disable @typescript-eslint/camelcase */
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    login(email: string, password: string): void;
    postToken(): Chainable<Subject>;
    getConfig(): Chainable<Subject>;
  }
}
//
// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  console.log('Custom command example: Login', email, password);
});

// Use POST request to get a token from keycloak and store in cypress environment variable for future api calls
Cypress.Commands.add('postToken', () => {
  const clientId = Cypress.env('client-id');
  const clientSecret = Cypress.env('client-secret');
  const grantType = 'password';
  const username = Cypress.env('email');
  const password = Cypress.env('password');
  cy.request({
    method: 'POST',
    url: Cypress.env('accessManagementApi') + Cypress.env('keycloakTokenUrlSuffix'),
    body: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      username: username,
      password: password,
    },
    form: true,
  }).then((response) => {
    Cypress.env('token', response.body.access_token);
  });
});

// Get all the config settings to store in cypress environment variables
Cypress.Commands.add('getConfig', () => {
  cy.request({
    method: 'GET',
    url: 'config/config.json',
  }).then((response) => {
    Cypress.env('eventServiceApiUrl', response.body.eventServiceApiUrl);
    Cypress.env('notificationServiceUrl', response.body.notificationServiceUrl);
    Cypress.env('keycloakUrl', response.body.keycloakUrl);
    Cypress.env('tenantManagementApi', response.body.tenantManagementApi);
    Cypress.env('accessManagementApi', response.body.accessManagementApi);
    Cypress.env('uiComponentUrl', response.body.uiComponentUrl);
    Cypress.env('fileApi', response.body.fileApi);
  });
});
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
