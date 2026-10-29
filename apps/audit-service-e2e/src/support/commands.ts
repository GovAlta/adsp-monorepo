// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    postToken(): Chainable<Subject>;
    getConfig(): Chainable<Subject>;
  }
}

Cypress.Commands.add('postToken', () => {
  const realm = Cypress.env('realm');
  cy.request({
    method: 'POST',
    url: `${Cypress.env('accessManagementApi')}/realms/${realm}${Cypress.env('keycloakTokenUrlSuffix')}`,
    body: {
      client_id: Cypress.env('client-id'),
      client_secret: Cypress.env('clientSecret'),
      grant_type: 'password',
      username: Cypress.env('email'),
      password: Cypress.env('password'),
    },
    form: true,
  }).then((response) => {
    Cypress.env('autotest-admin-token', response.body.access_token);
  });
});

Cypress.Commands.add('getConfig', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('tenantWebAppUrl')}config/config.json`,
  }).then((response) => {
    Cypress.env('accessManagementApi', response.body.serviceUrls.accessManagementApi);
  });
});
