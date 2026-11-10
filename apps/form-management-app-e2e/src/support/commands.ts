// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    login(tenantName: string): void;
  }
}

Cypress.Commands.add('login', (tenantName: string) => {
  cy.visit(`/${tenantName}/login?kc_idp_hint=`);
  cy.get('[name=username]').type(Cypress.env('email'));
  cy.get('[name=password]').type(Cypress.env('password'));
  cy.get('#kc-login').click();
  cy.wait(4000);
});
