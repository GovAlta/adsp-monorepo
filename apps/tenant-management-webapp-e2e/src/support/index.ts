/* eslint-disable no-var */
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-xpath';
import 'cypress-axe';

it('Get config settings and store them in environment variables', function () {
  cy.getConfig();
});

it('Get a token and store it in token environment variable', function () {
  cy.postToken();
});

Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('Cannot read properties of null') || // App error on event definition modal save
    err.message.includes("Failed to execute 'importScripts' on 'WorkerGlobalScope'") || // App error on event definition modal save
    err.message.includes('expected 0 to') || // App error for clicking Published filtering radio button on notices page
    err.message.includes("Cannot read property 'getText' of null") || // App error for saving notification templates
    err.message.includes("Cannot read properties of undefined (reading 'map')") // App error for saving file types
  ) {
    return false;
  }
  // we still want to ensure there are no other unexpected
  // errors, so we let them fail the test
});
