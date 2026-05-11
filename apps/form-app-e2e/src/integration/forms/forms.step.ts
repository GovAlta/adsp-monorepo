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

When('autotest user 3 is logged in to see {string} application', function (formDefinition) {
  cy.visit('/' + Cypress.env('tenantName') + '/' + formDefinition + '/login?kc_idp_hint=');
  // Enter user name and password and click log in button
  formsObj.usernameEmailField().type(Cypress.env('email3'));
  formsObj.passwordField().type(Cypress.env('password3'));
  formsObj.loginButton().click();
  cy.wait(8000); // Wait all the redirects to settle down
});

Then('the user views a form page with primary application button enabled for {string}', function (formName) {
  formsObj.formLandingPagePrimaryButton().shadow().find('button').should('be.enabled');
  formsObj.formLandingPageSubtitle().should('contain.text', formName);
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

When('the user enters {string} in a text area field labelled {string}', function (text: string, label) {
  formsObj.formTextAreaField(label).shadow().find('textarea').clear().type(text, { force: true, delay: 200 });
});

When('the user enters {string} in a numeric field labelled {string}', function (text: string, label) {
  formsObj.formNumericField(label).shadow().find('input').clear().type(text, { force: true, delay: 200 });
});

When('the user enters {string} in a date picker labelled {string}', function (date: string, label) {
  formsObj.formDateInput(label).shadow().find('input').clear().type(date, { force: true });
});

When('the user enters {string} in a time picker labelled {string}', function (time: string, label) {
  formsObj.formTimeInput(label).shadow().find('input').clear().type(time, { force: true });
});

When('the user enters {string} in a dropdown labelled {string}', function (value: string, label) {
  formsObj.formDropdown(label).shadow().find('input').click({ force: true });
  formsObj.formDropdown(label).shadow().find('goa-popover').find('li').contains(value).click({ force: true });
});

When(
  'the user uploads a file of {string} using file upload button for {string}',
  function (fileName: string, label: string) {
    formsObj
      .formFileUploadButton(label)
      .scrollIntoView()
      .find('input[type="file"]', { includeShadowDom: true })
      .selectFile('src/fixtures/' + fileName, { force: true });
    cy.wait(1000);
  }
);

When(
  'the user uploads a file of {string} using drag and drop zone for {string}',
  function (fileName: string, label: string) {
    formsObj
      .formFileDragDropZone(label)
      .scrollIntoView()
      .find('input[type="file"]', { includeShadowDom: true })
      .selectFile('src/fixtures/' + fileName, { force: true });
    cy.wait(1000);
  }
);

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

When('the user clicks Continue button for the list with detail in the form', function () {
  formsObj.formListWithDetailContinueButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user views a callout with a message of {string}', function (message) {
  formsObj.formSuccessCallout().shadow().find('h3').should('have.text', message);
});

Then(
  'the user views the summary of {string} with {string} as {string} {string}',
  function (sectionName, value, requiredOrNot, label: string) {
    switch (requiredOrNot) {
      case 'required':
        formsObj.formSummaryPageSectionRowLabel(sectionName, label).find('label').should('contains.text', 'required');
        formsObj.formSummaryPageSectionRowValue(sectionName, label).should('have.text', value);
        break;
      case 'not required':
        formsObj.formSummaryPageSectionRowValue(sectionName, label).should('have.text', value);
        break;
      default:
        expect(requiredOrNot).to.be.oneOf(['required', 'not required']);
    }
  }
);

Then(
  'the user {string} validation error on the summary of {string} for {string}',
  function (viewOrNot, sectionName, label: string) {
    switch (viewOrNot) {
      case 'should view':
        formsObj.formSummaryPageSectionRowValueError(sectionName, label).should('not.exist');
        break;
      case 'should not view':
        formsObj.formSummaryPageSectionRowValueError(sectionName, label).should('not.exist');
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['should view', 'should not view']);
    }
  }
);

Then(
  'the user views the summary of {string} with {string} as a {string}',
  function (sectionName, arrayElement: string, arrayLabel) {
    const allEntries: string[] = [];
    formsObj
      .formSummaryPageListWithDetailItems(sectionName, arrayLabel)
      .each(($row) => {
        cy.wrap($row)
          .find('span[data-testid*="-review"]')
          .then(($spans) => {
            const joinedRowData = [...$spans].map((span) => Cypress.$(span).text().trim()).join(':');
            allEntries.push(joinedRowData);
          });
      })
      .then(() => {
        expect(allEntries).to.include(arrayElement);
      });
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

Then(
  'the user views {string} validation error message under {string} field of {string} on summary page',
  function (errorMsg, textFieldLabel, sectionName) {
    formsObj
      .formSummaryPageValidationError(sectionName, textFieldLabel)
      .invoke('attr', 'error')
      .should('contains', errorMsg);
  }
);

Then('the user views the submit button is disabled on summary page', function () {
  formsObj.formSubmitButton().shadow().find('button').should('be.disabled');
});

When('the user clicks Download PDF copy link on form submission confirmation page', function () {
  cy.wait(3000); // Wait for the PDF generation to complete
  formsObj.formSummaryPagePDFDownloadLinkIcon().shadow().find('button').click({ force: true });
  cy.wait(3000);
});

Then('the user views the PDF copy of {string} being downloaded', function (pdfFileName) {
  const downloadsFolder = Cypress.config('downloadsFolder');
  cy.readFile(downloadsFolder + '/' + pdfFileName, { timeout: 15000 }).should('exist');
});

Then('the user views a callout message of {string}', function (calloutMessage) {
  formsObj.formNotAvailableCallout().should('contain.text', calloutMessage);
});

Then('the user views a success callout message of {string}', function (calloutMessage) {
  formsObj.ProcessingYourApplicationCallout().invoke('attr', 'heading').should('contain', calloutMessage);
});

Then('the user views a drafted form for {string}', function (formDefinitionName) {
  const regex = new RegExp(
    `https://.+/${formDefinitionName}/(?:[0-9a-fA-F]){8}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){12}`
  );
  cy.url().should('match', regex);
});

Then('the user views "Automated Test Application" as the form title', function () {
  formsObj.formTitle().should('have.text', 'Automated Test Application');
});

Then('the user views Application Progress with {string} progress status', function (progressStatus) {
  formsObj.formApplicationProgressText().should('have.text', progressStatus);
});

Then('the user views the task of {string} with {string} status', function (taskName, status) {
  formsObj.formTaskLink(taskName).should('exist');
  formsObj.formTaskStatus(taskName).invoke('attr', 'arialabel').should('eq', status);
});

Then('the user views Summary link as the last link in the table on task list page', function () {
  formsObj.formTaskListAllLinks().last().should('have.text', 'Summary');
});

When('the user clicks {string} task on task list page', function (taskName) {
  formsObj.formTaskLink(taskName).click({ force: true });
  cy.wait(2000);
});

Then('the user views Step {string} of {string} on the form page', function (currentStep, totalSteps) {
  formsObj.formStepIndicator().should('have.text', `Step ${currentStep} of ${totalSteps}`);
});

When('the user clicks Back to application overview link on the form page', function () {
  cy.wait(1000); // Wait for the page to save data to avoid losing the last data input
  formsObj.formBackToOverviewLink().click({ force: true });
});

When('the user clicks Next button on a tasklist step page', function () {
  cy.wait(1000); // Wait for the page to save data to avoid losing the last data input
  formsObj.formTaskListStepPageNextButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views section title of {string} on task list page', function (sectionTitle) {
  formsObj.formSectionTitle(sectionTitle).should('exist');
});

Then(
  'the user views an error message of {string} under the control labelled {string}',
  function (errorMsg, textFieldLabel) {
    formsObj
      .formTextFieldFormItem(textFieldLabel)
      .shadow()
      .find('[class^="error-msg"]')
      .should('contain.text', errorMsg);
  }
);

When('the user enters {string} in Social insurance number control', function (socialInsuranceNumber: string) {
  formsObj.formSocialInsuranceNumberField().shadow().find('input').type(socialInsuranceNumber);
});

// Due to full name control and full name and DOB control have the same field labels, this step only works with full name control with h3 label with Full name
When('the user enters {string} in full name control under Full name label', function (fullName: string) {
  const fullNameParts = fullName.split(',').map((part) => part.trim());
  if (fullNameParts.length !== 3) {
    expect.fail('Full name should consist of three parts separated by commas: first name, middle name, and last name.');
  }
  formsObj
    .formFullNameFirstNameField()
    .shadow()
    .find('input')
    .clear()
    .type(fullNameParts[0], { force: true, delay: 200 });
  formsObj
    .formFullNameMiddleNameField()
    .shadow()
    .find('input')
    .clear()
    .type(fullNameParts[1], { force: true, delay: 200 });
  formsObj
    .formFullNameLastNameField()
    .shadow()
    .find('input')
    .clear()
    .type(fullNameParts[2], { force: true, delay: 200 });
});

// Due to full name control and full name and DOB control have the same field labels, this step only works with full name and dob control with h3 label with Full name and date of birth
When(
  'the user enters {string} in full name and DOB control under Full name and date of birth label',
  function (fullName: string) {
    const fullNameDobParts = fullName.split(',').map((part) => part.trim());
    if (fullNameDobParts.length !== 4) {
      expect.fail(
        'Full name and DOB should consist of four parts separated by commas: first name, middle name, last name, and date of birth.'
      );
    }
    formsObj
      .formFullNameDobFirstNameField()
      .shadow()
      .find('input')
      .clear()
      .type(fullNameDobParts[0], { force: true, delay: 200 });
    formsObj
      .formFullNameDobMiddleNameField()
      .shadow()
      .find('input')
      .clear()
      .type(fullNameDobParts[1], { force: true, delay: 200 });
    formsObj
      .formFullNameDobLastNameField()
      .shadow()
      .find('input')
      .clear()
      .type('{selectall}{backspace}')
      .type(fullNameDobParts[2], { force: true, delay: 200 });
    formsObj
      .formFullNameDobDateOfBirthField()
      .shadow()
      .find('input')
      .clear({ force: true })
      .type(fullNameDobParts[3], { force: true, delay: 200 });
  }
);

When(
  'the user enters {string} in Alberta postal address control under Alberta mailing address label',
  function (postalAddress: string) {
    const addressParts = postalAddress.split(',').map((part) => part.trim());
    if (addressParts.length !== 3) {
      expect.fail(
        'Alberta postal address should consist of three parts separated by commas: street address, city, and postal code.'
      );
    }
    formsObj
      .formAlbertaPostalAddressStreetField()
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[0], { force: true, delay: 200 });
    formsObj
      .formAlbertaPostalAddressCityField()
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[1], { force: true, delay: 200 });
    formsObj
      .formAlbertaPostalAddressPostalCodeField()
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[2], { force: true, delay: 200 });
  }
);

When(
  'the user enters {string} in Canada postal address control under Canadian mailing address label',
  function (postalAddress: string) {
    const addressParts = postalAddress.split(',').map((part) => part.trim());
    if (addressParts.length !== 4) {
      expect.fail(
        'Canada postal address should consist of four parts separated by commas: street address, city, province, and postal code.'
      );
    }
    formsObj
      .formCanadianPostalAddressStreetField()
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[0], { force: true, delay: 200 });
    formsObj
      .formCanadianPostalAddressCityField()
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[1], { force: true, delay: 200 });
    formsObj
      .formCanadianPostalAddressPostalCodeField()
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[3], { force: true, delay: 200 });
    formsObj.formCanadianPostalAddressProvinceDropdown().shadow().find('input').click({ force: true });
    formsObj
      .formCanadianPostalAddressProvinceDropdown()
      .shadow()
      .find('goa-popover')
      .find('li')
      .contains(addressParts[2])
      .click({ force: true });
  }
);
