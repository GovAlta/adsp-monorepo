import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import FormsPage from './forms.page';
import { injectAxe } from '../../support/app.po';
import { htmlReport } from '../../support/axe-html-reporter-util';

const formsObj = new FormsPage();
let responseObj: Cypress.Response<any>;
let formId;

When('a user goes to form app overview site', function () {
  cy.visit('/');
  cy.wait(2000); // Wait all the redirects to settle down
});

Then('the user views the overview page of form app', function () {
  formsObj.formAppOverviewHeader().should('exist');
});

Then('no critical or serious accessibility issues on {string} page', function (pageName) {
  injectAxe();
  // check all accessibility issues and generate a report without failing the step.
  cy.checkA11y(
    null!,
    {},
    (violations) => {
      htmlReport(violations, true, 'public service status page' + '-all');
    },
    true
  );
  // check critical and serious accessibility issues and generate a report. Fail the step if there are any.
  cy.checkA11y(null!, { includedImpacts: ['critical', 'serious'] }, (violations) => {
    htmlReport(violations, true, pageName + '-critical&serious');
  });
});

When('an authenticated user is in the form app', function () {
  cy.visit('/' + Cypress.env('realm') + '/login?kc_idp_hint=');
  // Enter user name and password and click log in button
  formsObj.usernameEmailField().type(Cypress.env('email'));
  formsObj.passwordField().type(Cypress.env('password'));
  formsObj.loginButton().click();
  cy.wait(4000); // Wait all the redirects to settle down
});

When('an authenticated user is logged in to see {string} application', function (formDefinition) {
  cy.visit('/' + Cypress.env('tenantName') + '/' + formDefinition + '/login?kc_idp_hint=');
  // Enter user name and password and click log in button
  formsObj.usernameEmailField().type(Cypress.env('email'));
  formsObj.passwordField().type(Cypress.env('password'));
  formsObj.loginButton().click();
  cy.wait(8000); // Wait all the redirects to settle down
});

Given('an anonymous applicant goes to {string} application', function (formDefinition) {
  cy.visit('/' + Cypress.env('tenantName') + '/' + formDefinition);
  cy.wait(8000); // Wait all the redirects to settle down
});

Then('the user views a form draft of {string}', function (formDefinition) {
  cy.url().should('include', formDefinition);
  cy.url().then((url) => {
    formId = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(formId).to.be.not.null;
  });
  cy.viewport(1920, 1080);
});

Then('the user views an anonymous form draft of {string}', function (formDefinition) {
  cy.url().should('include', formDefinition + '/draft');
  cy.viewport(1920, 1080);
});

When('the user sends a delete form request', function () {
  expect(formId).not.equals(null);
  const formDeleteRequestURL = Cypress.env('formServiceApiUrl') + '/form/v1/forms/' + formId;
  cy.request({
    method: 'DELETE',
    url: formDeleteRequestURL,
    auth: {
      bearer: Cypress.env('autotest-admin-token'),
    },
  }).then(function (response) {
    responseObj = response;
  });
});

Then('the new form is deleted', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body.deleted).to.equal(true);
});

When('the user enters {string} in a text field labelled {string}', function (text: string, label) {
  formsObj.formTextField(label).shadow().find('input').clear().type(text, { force: true, delay: 200 });
});

When('the user enters {string} in a date picker labelled {string}', function (date: string, label) {
  formsObj.formDateInput(label).shadow().find('input').clear().type(date, { force: true });
});

When('the user enters {string} in a dropdown labelled {string}', function (value: string, label) {
  formsObj.formDropdown(label).find('goa-input').click({ force: true });
  formsObj.formDropdown(label).find('div').contains(value).click({ force: true });
});

When('the user clicks Next button in the form', function () {
  formsObj.formNextButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

When('the user {string} a checkbox labelled {string}', function (checkboxOperation, label) {
  formsObj
    .formCheckbox(label)
    .shadow()
    .find('[class^="container"]')
    .invoke('attr', 'class')
    .then((classAttVal) => {
      if (classAttVal == undefined) {
        expect.fail('Failed to get checkbox class attribute value.');
      } else {
        switch (checkboxOperation) {
          case 'selects':
            if (classAttVal.includes('selected')) {
              cy.log('The checkbox was already checked.');
            } else {
              formsObj.formCheckbox(label).shadow().find('[class^="container"]').click({ force: true });
              cy.wait(1000);
            }
            break;
          case 'unselects':
            if (classAttVal.includes('selected')) {
              formsObj.formCheckbox(label).shadow().find('[class^="container"]').click({ force: true });
              cy.wait(1000);
            } else {
              cy.log('The checkbox was already unchecked.');
            }
            break;
          default:
            expect(checkboxOperation).to.be.oneOf(['selects', 'unselects']);
        }
      }
    });
});

When('the user clicks submit button in the form', function () {
  cy.wait(2000);
  formsObj.formSubmitButton().shadow().find('button').click({ force: true });
  cy.wait(5000);
});

When('the user clicks list with detail button labelled as {string} in the form', function (label) {
  formsObj.formListWithDetailButton(label).shadow().find('button').click({ force: true });
  cy.wait(1000);
});

When(
  'the user enters {string} in list with detail element text field labelled {string}',
  function (text: string, label) {
    formsObj
      .formListWithDetailDependantTextField(label)
      .shadow()
      .find('input')
      .clear()
      .type(text, { force: true, delay: 200 });
  }
);

When(
  'the user enters {string} in list with detail element date input labelled {string}',
  function (date: string, label) {
    formsObj.formListWithDetailDependantDateInput(label).shadow().find('input').clear().type(date, { force: true });
  }
);

Then('the user views a callout with a message of {string}', function (message) {
  formsObj.formSuccessCallout().shadow().find('h3').should('have.text', message);
});

// List with detail label need to be passed in the format of <child element field label:parent array label>, i.e. First name:Dependant
Then(
  'the user views the summary of {string} with {string} as {string} {string}',
  function (sectionName, value, requiredOrNot, label: string) {
    let isFound = false;
    if (label.includes(':')) {
      const listWithDetailLabels = label.split(':');
      const arrayLabel = listWithDetailLabels[1].toLowerCase(); // Array labels need to be changed to lower case to use in xpath
      const fieldLabel = listWithDetailLabels[0];
      formsObj
        .formSummaryPageListWithDetailItems(sectionName, arrayLabel)
        .then((items) => {
          for (let i = 0; i < items.length; i++) {
            cy.log(items[i].outerText);
            switch (requiredOrNot) {
              case 'required':
                if (items[i].outerText == fieldLabel + ' *: ' + value) {
                  isFound = true;
                  cy.log(label + ': ' + value + ' is found? : ' + String(isFound));
                }
                break;
              case 'not required':
                if (items[i].outerText == fieldLabel + ': ' + value) {
                  isFound = true;
                  cy.log(label + ': ' + value + ' is found? : ' + String(isFound));
                }
                break;
              default:
                expect(requiredOrNot).to.be.oneOf(['required', 'not required']);
            }
          }
        })
        .then(() => {
          expect(isFound).to.be.true;
        });
    } else {
      formsObj
        .formSummaryPageControlValues(sectionName)
        .then((items) => {
          cy.log('Items found: ' + items.length);
          for (let i = 0; i < items.length; i++) {
            cy.log(items[i].outerText);
            switch (requiredOrNot) {
              case 'required':
                if (items[i].outerText == value) {
                  if (
                    items[i].parentElement?.getAttribute('requirement') == 'required' &&
                    items[i].parentElement?.getAttribute('label')?.trim() == label
                  ) {
                    isFound = true;
                    cy.log(label + ': ' + value + ' is found? : ' + String(isFound));
                  }
                }
                break;
              case 'not required':
                if (items[i].outerText == value) {
                  if (
                    !items[i].parentElement?.hasAttribute('requirement') &&
                    items[i].parentElement?.getAttribute('label')?.trim() == label
                  ) {
                    isFound = true;
                    cy.log(label + ': ' + value + ' is found? : ' + String(isFound));
                  }
                }
                break;
              default:
                expect(requiredOrNot).to.be.oneOf(['required', 'not required']);
            }
          }
        })
        .then(() => {
          expect(isFound).to.be.true;
        });
    }
  }
);

When('the user selects {string} radio button for the question of {string}', function (radioLabel, question) {
  formsObj.formRadioGroup(question).find(`[value="${radioLabel}"]`).shadow().find('input').click({ force: true });
  cy.wait(1000);
});

Given('the user deletes any existing form from {string} for {string}', function (userAddressAs, formDefinitionId) {
  let formId = 'NoFormFound';
  const requestURLGetForms =
    Cypress.env('formServiceApiUrl') + '/form/v1/forms?criteria={"definitionIdEquals":"' + formDefinitionId + '"}';
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
        const requestURLDeleteForm = Cypress.env('formServiceApiUrl') + '/form/v1/forms/' + formId;
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
