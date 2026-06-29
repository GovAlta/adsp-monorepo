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
  cy.wait(1000); // Wait for the numeric field to process the input
});

When('the user enters {string} in a date picker labelled {string}', function (date: string, label) {
  formsObj.formDateInput(label).shadow().find('input').clear().type(date, { force: true, delay: 200 });
  cy.wait(1000); // Wait for the date picker to process the input
});

When('the user enters {string} in a time picker labelled {string}', function (time: string, label) {
  formsObj.formTimeInput(label).shadow().find('input').clear().type(time, { force: true, delay: 200 });
  cy.wait(1000); // Wait for the date picker to process the input
});

When('the user enters {string} in a date time picker labelled {string}', function (time: string, label) {
  formsObj.formDateTimeInput(label).shadow().find('input').clear().type(time, { force: true, delay: 200 });
  cy.wait(1000); // Wait for the date time picker to process the input
});

When('the user enters {string} in a dropdown labelled {string}', function (value: string, label) {
  formsObj.formDropdown(label).shadow().find('input').click({ force: true });
  formsObj.formDropdown(label).shadow().find('goa-popover').find('li').contains(value).click({ force: true });
  cy.wait(1000); // Wait for the dropdown to process the input
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

When('the user clicks submit button on form summary page', function () {
  cy.wait(2000);
  formsObj.formSummaryPageSubmitButton().shadow().find('button').click({ force: true });
  cy.wait(5000);
});

When('the user clicks submit button on the form page', function () {
  cy.wait(2000);
  formsObj.formPageSubmitButton().shadow().find('button').click({ force: true });
  cy.wait(5000);
});

When('the user clicks list with detail button labelled as {string} in the form', function (label) {
  cy.wait(1000);
  formsObj
    .formListWithDetailButton(label)
    .should('exist')
    .shadow()
    .find('button')
    .should('be.visible')
    .should('not.be.disabled')
    .scrollIntoView()
    .click({ force: true });
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
    cy.wait(1000); // Wait for the date picker to process the input
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
        formsObj.formSummaryPageSectionRowValue(sectionName, label).scrollIntoView().should('have.text', value);
        break;
      default:
        expect(requiredOrNot).to.be.oneOf(['required', 'not required']);
    }
  }
);

Then(
  'the user views the summary of {string} with {string} as {string} {string} under {string} for standard name control',
  function (sectionName, value, requiredOrNot, label: string, subSection: string) {
    switch (requiredOrNot) {
      case 'required':
        formsObj
          .formSummaryPageSectionSubsectionRowLabel(sectionName, subSection, label)
          .find('label')
          .should('contains.text', 'required');
        formsObj
          .formSummaryPageSectionSubsectionRowValueForNameControl(sectionName, subSection, label)
          .should('have.text', value);
        break;
      case 'not required':
        formsObj
          .formSummaryPageSectionSubsectionRowValueForNameControl(sectionName, subSection, label)
          .should('have.text', value);
        break;
      default:
        expect(requiredOrNot).to.be.oneOf(['required', 'not required']);
    }
  }
);

Then(
  'the user views the summary of {string} with {string} as {string} {string} under {string} for standard postal address control',
  function (sectionName, value, requiredOrNot, label: string, subSection: string) {
    switch (requiredOrNot) {
      case 'required':
        formsObj
          .formSummaryPageSectionSubsectionRowLabel(sectionName, subSection, label)
          .find('label')
          .should('contains.text', 'required');
        formsObj
          .formSummaryPageSectionSubsectionRowValueForAddressControl(sectionName, subSection, label)
          .should('have.text', value);
        break;
      case 'not required':
        formsObj
          .formSummaryPageSectionSubsectionRowValueForAddressControl(sectionName, subSection, label)
          .should('have.text', value);
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
      .formSummaryPageObjectListItems(sectionName, arrayLabel)
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

Then(
  'the user views the summary of {string} with all entries {string} as {string}',
  function (sectionName, arrayElements: string, arrayLabel) {
    const allEntries: string[] = [];
    formsObj
      .formSummaryPageObjectListItems(sectionName, arrayLabel)
      .each(($row) => {
        cy.wrap($row)
          .find('span[data-testid*="-review"]')
          .then(($spans) => {
            const joinedRowData = [...$spans].map((span) => Cypress.$(span).text().trim()).join(':');
            allEntries.push(joinedRowData);
          });
      })
      .then(() => {
        const normalize = (value: string) =>
          value
            .replace(/\s*:\s*/g, ':')
            .replace(/\s+/g, ' ')
            .trim();
        const expectedEntries = arrayElements
          .split(';')
          .map((entry) => normalize(entry))
          .filter(Boolean);
        const actualEntries = allEntries.map((entry) => normalize(entry));
        expect(actualEntries).to.deep.equal(expectedEntries);
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
  formsObj.formSummaryPageSubmitButton().shadow().find('button').should('be.disabled');
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
    formsObj.formFormItem(textFieldLabel).shadow().find('[class^="error-msg"]').should('contain.text', errorMsg);
  }
);

When(
  'the user enters {string} in Social insurance number control under {string} label',
  function (socialInsuranceNumber: string, label: string) {
    formsObj.formSocialInsuranceNumberField(label).shadow().find('input').type(socialInsuranceNumber);
  }
);

// Due to full name control and full name and DOB control have the same field labels, this step only works with full name control with h3 label
When('the user enters {string} in full name control under {string} label', function (fullName: string, label: string) {
  const fullNameParts = fullName.split(',').map((part) => part.trim());
  if (fullNameParts.length !== 3) {
    expect.fail('Full name should consist of three parts separated by commas: first name, middle name, and last name.');
  }
  formsObj
    .formFullNameFirstNameField(label)
    .shadow()
    .find('input')
    .clear()
    .type(fullNameParts[0], { force: true, delay: 200 });
  formsObj
    .formFullNameMiddleNameField(label)
    .shadow()
    .find('input')
    .clear()
    .type(fullNameParts[1], { force: true, delay: 200 });
  formsObj
    .formFullNameLastNameField(label)
    .shadow()
    .find('input')
    .clear()
    .type(fullNameParts[2], { force: true, delay: 200 });
});

// Due to full name control and full name and DOB control have the same field labels, this step only works with full name and dob control with h3 label
When(
  'the user enters {string} in full name and DOB control under {string} label',
  function (fullName: string, label: string) {
    const fullNameDobParts = fullName.split(',').map((part) => part.trim());
    if (fullNameDobParts.length !== 4) {
      expect.fail(
        'Full name and DOB should consist of four parts separated by commas: first name, middle name, last name, and date of birth.'
      );
    }
    formsObj
      .formFullNameDobFirstNameField(label)
      .shadow()
      .find('input')
      .clear()
      .type(fullNameDobParts[0], { force: true, delay: 200 });
    formsObj
      .formFullNameDobMiddleNameField(label)
      .shadow()
      .find('input')
      .clear()
      .type(fullNameDobParts[1], { force: true, delay: 200 });
    formsObj
      .formFullNameDobLastNameField(label)
      .shadow()
      .find('input')
      .clear()
      .type('{selectall}{backspace}')
      .type(fullNameDobParts[2], { force: true, delay: 200 });
    formsObj
      .formFullNameDobDateOfBirthField(label)
      .shadow()
      .find('input')
      .clear({ force: true })
      .type(fullNameDobParts[3], { force: true, delay: 200 });
  }
);

When(
  'the user enters {string} in Alberta postal address control under {string} label',
  function (postalAddress: string, label: string) {
    const addressParts = postalAddress.split(',').map((part) => part.trim());
    if (addressParts.length !== 3) {
      expect.fail(
        'Alberta postal address should consist of three parts separated by commas: street address, city, and postal code.'
      );
    }
    formsObj
      .formAlbertaPostalAddressStreetField(label)
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[0], { force: true, delay: 200 });
    formsObj
      .formAlbertaPostalAddressCityField(label)
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[1], { force: true, delay: 200 });
    formsObj
      .formAlbertaPostalAddressPostalCodeField(label)
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[2], { force: true, delay: 200 });
  }
);

When(
  'the user enters {string} in Canada postal address control under {string} label',
  function (postalAddress: string, label: string) {
    const addressParts = postalAddress.split(',').map((part) => part.trim());
    if (addressParts.length !== 4) {
      expect.fail(
        'Canada postal address should consist of four parts separated by commas: street address, city, province, and postal code.'
      );
    }
    formsObj
      .formCanadianPostalAddressStreetField(label)
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[0], { force: true, delay: 200 });
    formsObj
      .formCanadianPostalAddressCityField(label)
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[1], { force: true, delay: 200 });
    formsObj
      .formCanadianPostalAddressPostalCodeField(label)
      .shadow()
      .find('input')
      .clear()
      .type(addressParts[3], { force: true, delay: 200 });
    formsObj.formCanadianPostalAddressProvinceDropdown(label).shadow().find('input').click({ force: true });
    formsObj
      .formCanadianPostalAddressProvinceDropdown(label)
      .shadow()
      .find('goa-popover')
      .find('li')
      .contains(addressParts[2])
      .click({ force: true });
  }
);

Then('the user {string} the text field labelled {string}', function (viewOrNot, label) {
  const field = formsObj.formTextField(label);
  if (viewOrNot === 'views') {
    field.should('be.visible');
  } else if (viewOrNot === 'should not view') {
    field.should('not.be.visible');
  } else {
    expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

When('the user enters {string} in the integer field labelled {string}', function (value: string, label) {
  formsObj
    .formFormItem(label)
    .find('goa-input')
    .shadow()
    .find('input')
    .focus()
    .click({ force: true })
    .type('{selectall}{del}', { force: true }) // select all, then delete due to clear() doesn't work with this control
    .type(value, { force: true, delay: 200 });
});

Then('the user views the text field of {string} is {string}', function (label, enabledOrNot) {
  if (enabledOrNot === 'enabled') {
    formsObj.formTextField(label).shadow().find('input').should('be.enabled');
  } else if (enabledOrNot === 'disabled') {
    formsObj.formTextField(label).shadow().find('input').should('not.be.enabled');
  } else {
    expect(enabledOrNot).to.be.oneOf(['enabled', 'disabled']);
  }
});

//Value array is separated by semicolon, e.g. "valueA1, valueB1; valueA2, valueB2"
When('the user enters {string} in {string} object array control', function (valueArray: string, label: string) {
  // Split the value array string into an array of values
  const valueArraySplit = valueArray.split(';').map((item) => item.trim());
  valueArraySplit.forEach((value, index) => {
    const valueParts = value.split(',').map((part) => part.trim());
    formsObj.formObjectListAddButton(label).shadow().find('button').click({ force: true });
    cy.wait(1000); // Wait for the object list to add a new row
    valueParts.forEach((part, partIndex) => {
      formsObj
        .formObjectListFormItem(label, String(index + 1), String(partIndex + 1))
        .find('goa-input')
        .shadow()
        .find('input')
        .type(part, { force: true, delay: 200 });
    });
  });
});

// Only text fields are supported in the list with detail for now, so the valueParts are all typed into text fields. Value array is separated by semicolon, e.g. "valueA1, valueB1; valueA2, valueB2"
When('the user enters {string} in {string} List with detail control', function (valueArray: string, label: string) {
  // Split the value array string into an array of values
  const valueArraySplit = valueArray.split(';').map((item) => item.trim());
  valueArraySplit.forEach((value) => {
    const valueParts = value.split(',').map((part) => part.trim());
    formsObj.formListWithDetailButtonWithListLabel(label).shadow().find('button').click({ force: true });
    cy.wait(1000); // Wait for the list with detail to add a new row
    valueParts.forEach((part, partIndex) => {
      formsObj
        .formListWithDetailFormItem(label, String(partIndex + 1))
        .find('goa-input')
        .shadow()
        .find('input')
        .type(part, { force: true, delay: 200 });
    });
    formsObj.formListWithDetailContinueButton().shadow().find('button').click({ force: true });
  });
});

Then('the user views the text field labelled {string} is required', function (label) {
  formsObj.formFormItem(label).invoke('attr', 'requirement').should('eq', 'required');
});

Then('the user views the text field labelled {string} is not required', function (label) {
  formsObj.formFormItem(label).should('not.have.attr', 'requirement');
});

Then('the user views the submit button is {string} on the form page', function (enabledOrNot: 'enabled' | 'disabled') {
  if (enabledOrNot === 'enabled') {
    cy.wait(1000); // Wait for button to change status
    formsObj.formPageSubmitButton().shadow().find('button').should('be.enabled');
  } else if (enabledOrNot === 'disabled') {
    cy.wait(1000); // Wait for button to change status
    formsObj.formPageSubmitButton().shadow().find('button').should('not.be.enabled');
  } else {
    expect(enabledOrNot).to.be.oneOf(['enabled', 'disabled']);
  }
});
