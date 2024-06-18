import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import FormAppPage from './form-app.page';

const formAppObj = new FormAppPage();
let formId;

Given('the user deletes any existing form from {string} for {string}', function (userAddressAs, formDefinitionId) {
  let formId = 'NoFormFound';
  const requestURLGetForms =
    Cypress.env('formApi') + 'form/v1/forms?criteria={"definitionIdEquals":"' + formDefinitionId + '"}';
  cy.request({
    method: 'GET',
    url: requestURLGetForms,
    auth: {
      bearer: Cypress.env('autotest-admin-token'),
    },
  })
    .then((response) => {
      for (let arrayIndex = 0; arrayIndex < response.body.results.length; arrayIndex++) {
        cy.log(
          'form #' +
            String(arrayIndex + 1) +
            ': ' +
            response.body.results[arrayIndex].createdBy.name +
            '; ' +
            response.body.results[arrayIndex].id
        );
        if (response.body.results[arrayIndex].createdBy.name.includes(userAddressAs)) {
          formId = response.body.results[arrayIndex].id;
        }
      }
    })
    .then(() => {
      cy.log('Form id found: ' + formId);
      if (formId !== 'NoFormFound') {
        const requestURLDeleteForm = Cypress.env('formApi') + 'form/v1/forms/' + formId;
        cy.request({
          method: 'DELETE',
          url: requestURLDeleteForm,
          auth: {
            bearer: Cypress.env('autotest-admin-token'),
          },
        });
      }
    });
});

When('the user is logged in to see {string} application', function (formDefinition) {
  cy.visit(Cypress.env('formAppUrl') + Cypress.env('tenantName') + '/' + formDefinition + '/login?kc_idp_hint=');
  cy.wait(2000);
  // Enter user name and password and click log in button if login page shows
  cy.url().then((url) => {
    if (url.includes('auth/realms/')) {
      formAppObj.usernameEmailField().type(Cypress.env('email'));
      formAppObj.passwordField().type(Cypress.env('password'));
      formAppObj.loginButton().click();
    }
  });
  cy.wait(6000); // Wait all the redirects to settle down
});

Then('the user views a from draft of {string}', function (formDefinition) {
  cy.url().should('include', formDefinition);
  cy.url().then((url) => {
    formId = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(formId).to.be.not.null;
  });
});

When('the user enters {string} in a text field labelled {string}', function (text, label) {
  formAppObj.formTextField(label).shadow().find('input').clear().type(text, { force: true, delay: 200 });
});

When('the user clicks submit button in the form', function () {
  cy.wait(2000);
  formAppObj.formSubmitButton().shadow().find('button').click({ force: true });
  cy.wait(5000);
});
