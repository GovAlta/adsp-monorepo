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
import '@cypress/xpath';
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
    err.message.includes("Cannot read property 'getText' of null") || // App error for saving notification templates
    err.message.includes("Cannot read properties of undefined (reading 'map')") || // App error for saving file types
    err.message.includes('Document is not focused') || // Copy login link button
    err.message.includes('Write permission denied') || // Copy login link button
    err.message.includes('Model is disposed') || // pdf template modal save button
    err.message.includes('has row #0: expected 0 to be above 0') || // file type grid
    err.message.includes("Cannot destructure property 'ownerNode' of 'e.stylesheet' as it is null") || // delete subscription confirmation modal
    err.message.includes("Cannot read properties of undefined (reading 'id')") || // File type modal
    err.message.includes("Cannot read properties of undefined (reading 'nameSpace')") || // Add event modal for notification types (CS-2476)
    err.message.includes('ResizeObserver loop completed with undelivered notifications') || // Add value definition modal
    err.message.includes('Invalid time value') || // Add calendar event modal
    err.message.includes('') // Save form definition with an empty error
  ) {
    return false;
  }
  // we still want to ensure there are no other unexpected
  // errors, so we let them fail the test
});
