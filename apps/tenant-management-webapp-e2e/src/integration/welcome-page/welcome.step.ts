import { getGreeting } from '../../support/app.po';
import { When, Then } from 'cypress-cucumber-preprocessor/steps';

// describe('tenant-management-webapp', () => {
//   beforeEach(() => cy.visit('/'));

//   it('should display welcome message', () => {
//     // Custom command example, see `../support/commands.ts` file
//     // cy.login('my-email@something.com', 'myPassword');

//     // Function helper example, see `../support/app.po.ts` file
//     getGreeting().contains('A platform built for government services');
//   });
// });

When('the user goes to the tenant management welcome page', function () {
  cy.visit('/');
});

Then('the user views the tenant management welcome page title', function () {
  getGreeting().contains('A platform built for government services');
});
