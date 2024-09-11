import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import feedback from './feedback.page';
import commonlib from '../common/common-library';
import common from '../common/common.page';

const feedbackObj = new feedback();
const commonObj = new common();

Then('the user views {string} section on feedback overview page', function (sectionName) {
  feedbackObj.feedbackOverviewTab().should('exist');
  switch (sectionName) {
    case 'description':
      feedbackObj
        .feedbackOverviewDescription()
        .invoke('text')
        .should(
          'contain',
          'The feedback service provides a backend API and a frontend widget for applications to accept feedback from users. Feedback comments are anonymized using the PII service and records are stored and available from the Value service API.'
        );
      break;
    case 'Sites':
      feedbackObj
        .feedbackOverviewSitesContent()
        .invoke('text')
        .should(
          'contain',
          'Configure the sites against which feedback is allowed. Enable anonymous feedback for a site so that unauthenticated users can send feedback directly to the API, but note that this could reduce the quality of feedback.'
        );
      break;
    case 'Feedback widget':
      feedbackObj
        .feedbackOverviewFeedbackWidgetContent()
        .invoke('text')
        .should('contain', 'Reference the feedback widget script in <head> to set the adspFeedback global variable.');
      feedbackObj.feedbackOverviewFeedbackWidgetContent().invoke('text').should('contain', 'adspFeedback.initialize');
      break;
    default:
      expect(sectionName).to.be.oneOf(['description', 'Sites', 'Feedback widget']);
  }
});

Given('a tenant admin user is on Feedback Sites page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Feedback', 4000);
  commonObj.serviceTab('Feedback', 'Sites').click();
  cy.wait(4000);
});

When('the user clicks Register site button on Sites page', function () {
  feedbackObj.feedbackSitesRegisterSiteButton().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user {string} Register site modal', function (viewOrNot) {
  switch (viewOrNot) {
    case 'views':
      feedbackObj.feedbackSitesSiteModalTitle().invoke('text').should('eq', 'Register site');
      break;
    case 'should not view':
      feedbackObj.feedbackSitesSiteModalTitle().should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

Then('the user views the checkbox of Allow anonymous feedback is unchecked', function () {
  feedbackObj
    .feedbackSitesSiteModalAnonymousCheckbox()
    .shadow()
    .find('.goa-checkbox-container')
    .invoke('attr', 'class')
    .should('not.contain', 'selected');
});

Then('the user views the hint text of {string}', function (hintText) {
  feedbackObj.feedbackSitesRegisterSiteModalHintText(hintText).should('exist');
});

When('the user enters {string}, {string} in Register site modal', function (siteUrl, isAnonymous) {
  feedbackObj
    .feedbackSitesSiteModalAnonymousCheckbox()
    .shadow()
    .find('.goa-checkbox-container')
    .invoke('attr', 'class')
    .then((classAttVal) => {
      if (classAttVal == undefined) {
        expect.fail('Failed to get checkbox class attribute value.');
      } else {
        switch (isAnonymous) {
          case 'Yes':
            if (classAttVal.includes('selected')) {
              cy.log('The checkbox was already checked.');
            } else {
              feedbackObj
                .feedbackSitesSiteModalAnonymousCheckbox()
                .shadow()
                .find('.goa-checkbox-container')
                .click({ force: true });
              cy.wait(1000);
            }
            break;
          case 'No':
            if (classAttVal.includes('selected')) {
              feedbackObj
                .feedbackSitesSiteModalAnonymousCheckbox()
                .shadow()
                .find('.goa-checkbox-container')
                .click({ force: true });
              cy.wait(1000);
            } else {
              cy.log('The checkbox was already unchecked.');
            }
            break;
          default:
            expect(isAnonymous).to.be.oneOf(['Yes', 'No']);
        }
      }
    });
  feedbackObj.feedbackSitesSiteModalSiteUrl().shadow().find('input').clear().type(siteUrl, { force: true, delay: 200 });
});

When('the user clicks Register button in Register site modal', function () {
  feedbackObj.feedbackSitesRegisterSiteModalRegisterBtn().shadow().find('button').should('not.be.disabled');
  feedbackObj.feedbackSitesRegisterSiteModalRegisterBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

When('the user clicks Cancel button in site modal', function () {
  feedbackObj.feedbackSitesSiteModalCancelBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then('the user {string} {string}, {string} on Sites page', function (viewOrNot, siteUrl, isAnonymous) {
  findSite(siteUrl, isAnonymous).then((rowNumber) => {
    switch (viewOrNot) {
      case 'views':
        expect(rowNumber).to.be.greaterThan(0, 'Record of ' + siteUrl + ', ' + isAnonymous + ' has row #' + rowNumber);
        break;
      case 'should not view':
        expect(rowNumber).to.equal(0, 'Record of ' + siteUrl + ', ' + isAnonymous + ' has row #' + rowNumber);
        break;
      default:
        expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
    }
  });
});

//Find site with siteUrl, anonymous
//Input: siteUrl, anonymous in string
//Return: row number if the record is found; zero if the record isn't found
function findSite(siteUrl, anonymous) {
  return new Cypress.Promise((resolve, reject) => {
    try {
      let rowNumber = 0;
      const targetedNumber = 2;
      feedbackObj
        .feedbackSitesTableBody()
        .find('tr')
        .then((rows) => {
          rows.toArray().forEach((rowElement) => {
            let counter = 0;
            // cy.log(rowElement.cells[0].innerHTML); // Print out the namespace cell innerHTML for debug purpose
            if (rowElement.cells[0].innerHTML.includes(siteUrl)) {
              counter = counter + 1;
            }
            // cy.log(rowElement.cells[2].innerHTML); // Print out the name cell innerHTML for debug purpose
            if (rowElement.cells[1].innerHTML.includes(anonymous)) {
              counter = counter + 1;
            }
            Cypress.log({
              name: 'Number of matched items for row# ' + rowElement.rowIndex + ': ',
              message: String(String(counter)),
            });
            if (counter == targetedNumber) {
              rowNumber = rowElement.rowIndex;
            }
          });
          Cypress.log({
            name: 'Row number for the found record: ',
            message: String(rowNumber),
          });
          resolve(rowNumber);
        });
    } catch (error) {
      reject(error);
    }
  });
}

Then('the user views Register button is disabled in Register site modal', function () {
  feedbackObj.feedbackSitesRegisterSiteModalRegisterBtn().shadow().find('button').should('be.disabled');
});

Then('the user views error message {string} for Site URL in Register site modal', function (errorMsg) {
  feedbackObj.feedbackSitesSiteModalSiteUrlFormItem().invoke('attr', 'error').should('contain', errorMsg);
});

When('the user clicks {string} button for the site of {string}, {string}', function (button, siteUrl, isAnonymous) {
  findSite(siteUrl, isAnonymous).then((rowNumber) => {
    switch (button) {
      case 'Edit':
        feedbackObj.feedbackSitesEditButton(rowNumber).shadow().find('button').click({ force: true });
        cy.wait(2000);
        break;
      case 'Delete':
        feedbackObj.feedbackSitesDeleteButton(rowNumber).shadow().find('button').click({ force: true });
        cy.wait(2000);
        break;
      default:
        expect(button).to.be.oneOf(['Edit', 'Delete']);
    }
  });
});

Then('the user views Edit registered site modal', function () {
  feedbackObj.feedbackSitesSiteModalTitle().invoke('text').should('eq', 'Edit registered site');
});

Then('the user views Site URL field is disabled', function () {
  feedbackObj.feedbackSitesSiteModalSiteUrl().shadow().find('input').should('be.disabled');
});

Then('the user views {string} as Site URL value', function (siteUrl) {
  feedbackObj.feedbackSitesSiteModalSiteUrl().invoke('attr', 'value').should('eq', siteUrl);
});

When(
  'the user enters {string} for the checkbox of Allow anoymous feedback in Edit registered site',
  function (isAnonymous) {
    feedbackObj
      .feedbackSitesSiteModalAnonymousCheckbox()
      .shadow()
      .find('.goa-checkbox-container')
      .invoke('attr', 'class')
      .then((classAttVal) => {
        if (classAttVal == undefined) {
          expect.fail('Failed to get checkbox class attribute value.');
        } else {
          switch (isAnonymous) {
            case 'Yes':
              if (classAttVal.includes('selected')) {
                cy.log('The checkbox was already checked.');
              } else {
                feedbackObj
                  .feedbackSitesSiteModalAnonymousCheckbox()
                  .shadow()
                  .find('.goa-checkbox-container')
                  .click({ force: true });
                cy.wait(1000);
              }
              break;
            case 'No':
              if (classAttVal.includes('selected')) {
                feedbackObj
                  .feedbackSitesSiteModalAnonymousCheckbox()
                  .shadow()
                  .find('.goa-checkbox-container')
                  .click({ force: true });
                cy.wait(1000);
              } else {
                cy.log('The checkbox was already unchecked.');
              }
              break;
            default:
              expect(isAnonymous).to.be.oneOf(['Yes', 'No']);
          }
        }
      });
  }
);

When('the user clicks Save button in Edit registered site modal', function () {
  feedbackObj.feedbackSitesEditRegisteredSiteModalSaveBtn().shadow().find('button').should('not.be.disabled');
  feedbackObj.feedbackSitesEditRegisteredSiteModalSaveBtn().shadow().find('button').click({ force: true });
  cy.wait(1000);
});

Then(
  'the user views the site of {string}, {string} is listed before the site of {string}, {string}',
  function (siteUrl1, isAnonymous1, siteUrl2, isAnonymous2) {
    findSite(siteUrl1, isAnonymous1).then((rowNumber1) => {
      findSite(siteUrl2, isAnonymous2).then((rowNumber2) => {
        const row2 = Number(JSON.stringify(rowNumber2));
        expect(rowNumber1).to.be.lessThan(row2);
      });
    });
  }
);

When('the user clicks the Feedback badge', function () {
  feedbackObj.feedbackBadge().click();
});

Then('the user {string} Give feedback start modal', function (viewOrNot) {
  switch (viewOrNot) {
    case 'views':
      feedbackObj.feedbackStartModal().should('exist');
      break;
    case 'should not view':
      feedbackObj.feedbackStartModal().should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

When('the user clicks close icon on Give feedback start modal', function () {
  feedbackObj.feedbackStartModalCloseBtn().click();
});

When('the user clicks Start button in Give feedback start modal', function () {
  feedbackObj.feedbackStartModalStartBtn().click();
});

Then('the user views 5 emoji ratings in Give feedback main modal', function () {
  feedbackObj.feedbackMainModalRatingVeryDifficult().should('be.visible');
  feedbackObj.feedbackMainModalRatingDifficult().should('be.visible');
  feedbackObj.feedbackMainModalRatingVeryNeutral().should('be.visible');
  feedbackObj.feedbackMainModalRatingEasy().should('be.visible');
  feedbackObj.feedbackMainModalRatingVeryEasy().should('be.visible');
});

Then('the user views optional comments text field', function () {
  feedbackObj.feedbackMainModalAdditionalCommentsLabel().should('be.visible');
  feedbackObj
    .feedbackMainModalAdditionalCommentsLabelRequiredOrOptional()
    .invoke('text')
    .should('contains', 'optional');
  feedbackObj.feedbackMainModalAdditionalCommentsTextField().should('be.visible');
});

Then('the user views a required technical issues area', function () {
  cy.viewport(1920, 1080);
  feedbackObj.feedbackMainModalTechnicalIssuesLabel().should('be.visible');
  feedbackObj.feedbackMainModalTechnicalIssuesLabelRequiredOrOptional().invoke('text').should('contains', 'required');
  feedbackObj.feedbackMainModalTechnicalIssuesRadios().should('be.visible');
});

When(
  'the user enters {string}, {string}, {string}, {string} in Give feedback main modal',
  function (rating, comments, haveIssues, detail) {
    feedbackObj.feedbackMainModalRating(rating).click();
    if (comments !== 'N/A') {
      feedbackObj.feedbackMainModalAdditionalCommentsTextField().type(comments);
    }
    switch (haveIssues.toLowerCase()) {
      case 'yes':
        feedbackObj.feedbackMainModalTechnicalIssuesYesRadio().click();
        if (detail !== 'N/A') {
          feedbackObj.feedbackMainModalTechnicalIssuesTextField().type(detail);
        }
        break;
      case 'no':
        feedbackObj.feedbackMainModalTechnicalIssuesNoRadio().click();
        break;
      default:
        expect(haveIssues.toLowerCase()).to.be.oneOf(['yes', 'no']);
    }
  }
);

When('the user clicks Cancel button in Give feedback main modal', function () {
  feedbackObj.feedbackMainModalCancelButton().click();
  cy.wait(1000);
});

When('the user clicks Submit button in Give feedback main modal', function () {
  feedbackObj.feedbackMainModalSubmitButton().click();
  cy.wait(1000);
});

Then('the user {string} Give feedback main modal', function (viewOrNot) {
  switch (viewOrNot) {
    case 'views':
      feedbackObj.feedbackMainModal().should('exist');
      break;
    case 'should not view':
      feedbackObj.feedbackMainModal().should('not.exist');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});

Then('the user views success message for submitting a feedback', function () {
  feedbackObj.feedbackMainModalSuccessMessage().invoke('text').should('contain', 'Success');
});

When('the user clicks Close button in Give feedback modal', function () {
  feedbackObj.feedbackMainModalSuccessMessageCloseBtn().click();
  cy.wait(1000);
});

Then('the user {string} the Feedback badge', function (viewOrNot) {
  switch (viewOrNot) {
    case 'views':
      feedbackObj.feedbackBadge().should('be.visible');
      break;
    case 'should not view':
      feedbackObj.feedbackBadge().should('not.be.visible');
      break;
    default:
      expect(viewOrNot).to.be.oneOf(['views', 'should not view']);
  }
});
