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
  const grantType = 'client_credentials';
  cy.request({
    method: 'POST',
    url: Cypress.env('keycloak'),
    body: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
    },
    form: true,
  }).then((response) => {
    Cypress.env('token', response.body.access_token);
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
