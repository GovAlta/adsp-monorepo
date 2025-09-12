import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
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
    .find('[class^="container"]')
    .invoke('attr', 'class')
    .should('not.contain', 'selected');
});

Then('the user views the hint text of {string}', function (hintText) {
  feedbackObj.feedbackSitesRegisterSiteModalHintText(hintText).should('exist');
});

When('the user enters {string}, {string} in Register site modal', function (siteUrl: string, isAnonymous) {
  feedbackObj
    .feedbackSitesSiteModalAnonymousCheckbox()
    .shadow()
    .find('[class^="container"]')
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
                .find('[class^="container"]')
                .click({ force: true });
              cy.wait(1000);
            }
            break;
          case 'No':
            if (classAttVal.includes('selected')) {
              feedbackObj
                .feedbackSitesSiteModalAnonymousCheckbox()
                .shadow()
                .find('[class^="container"]')
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
      .find('[class^="container"]')
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
                  .find('[class^="container"]')
                  .click({ force: true });
                cy.wait(1000);
              }
              break;
            case 'No':
              if (classAttVal.includes('selected')) {
                feedbackObj
                  .feedbackSitesSiteModalAnonymousCheckbox()
                  .shadow()
                  .find('[class^="container"]')
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

Then('the user views a technical issues area', function () {
  cy.viewport(1920, 1080);
  feedbackObj.feedbackMainModalTechnicalIssuesLabel().should('be.visible');
  feedbackObj.feedbackMainModalTechnicalIssuesRadios().should('be.visible');
});

When(
  'the user enters {string}, {string}, {string}, {string} in Give feedback main modal',
  function (rating, comments: string, haveIssues: string, detail: string) {
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

Given('a tenant admin user is on Feedback service Feedback page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Feedback', 4000);
  commonObj.serviceTab('Feedback', 'Feedback').click();
  cy.wait(4000);
});

Then('the user views site URLs from sites page in Registered sites dropdown', function () {
  //Get sites dropdown items
  const dropdownSiteURLs: string[] = [];
  const feedbackSitesPageItems: string[] = [];
  feedbackObj.feedbackFeedbackSitesDropdownItems().then((dropdownItems) => {
    for (let i = 0; i < dropdownItems.length; i++) {
      dropdownSiteURLs[i] = dropdownItems[i].getAttribute('label')!;
      cy.log(dropdownSiteURLs[i]);
    }

    //Go to sites page to get all sites and compare
    commonObj.serviceTab('Feedback', 'Sites').click();
    cy.wait(4000);
    feedbackObj.feedbackSitesSiteURLs().then((siteURLs) => {
      expect(dropdownItems.length).to.eq(siteURLs.length);
      for (let i = 0; i < siteURLs.length; i++) {
        feedbackSitesPageItems[i] = siteURLs[i].outerText!;
        cy.log(feedbackSitesPageItems[i]);
        expect(dropdownSiteURLs[i]).to.eq(feedbackSitesPageItems[i]);
      }
    });
  });

  //Go back to feedback page
  commonObj.serviceTab('Feedback', 'Feedback').click();
  cy.wait(4000);
});

When('the user selects the adsp site in Registered sites dropdown', function () {
  feedbackObj.feedbackFeedbackSitesDropdown().shadow().find('input').click({ force: true });
  feedbackObj.feedbackFeedbackSitesDropdown().shadow().find('li').contains('https://adsp-').click({ force: true });
  cy.wait(2000);
});

Then('the user views a feedback list with Date submitted, Page, Rating, Action', function () {
  feedbackObj.feedbackFeedbackTableHeaders().then((elements) => {
    expect(elements[0].outerText).to.eq('Date submitted');
    expect(elements[1].outerText).to.eq('Page');
    expect(elements[2].outerText).to.eq('Rating');
    expect(elements[3].outerText).to.eq('Action');
  });
});

Then('the user views a feedback list of 10 ordered from most recent to oldest', function () {
  //Compare submitted on dates in the top 10 records
  feedbackObj.feedbackFeedbackTableSubmittedOnCells().then((elements) => {
    expect(elements.length).to.eq(10);
    let date1, year1, month1, day1, date2, year2, month2, day2;
    for (let i = 0; i < 9; i++) {
      // Get later date
      cy.log(elements[i].outerText);
      year1 = elements[i].outerText.split(',')[1].trim();
      month1 = elements[i].outerText.split(',')[0].split(' ')[0].trim();
      day1 = elements[i].outerText.split(',')[0].split(' ')[1].trim().replace(/\D/g, '');
      date1 = new Date(month1 + ' ' + day1 + ', ' + year1);
      cy.log(date1.toLocaleDateString());
      // Get earlier date
      cy.log(elements[i + 1].outerText);
      year2 = elements[i + 1].outerText.split(',')[1].trim();
      month2 = elements[i + 1].outerText.split(',')[0].split(' ')[0].trim();
      day2 = elements[i + 1].outerText.split(',')[0].split(' ')[1].trim().replace(/\D/g, '');
      date2 = new Date(month2 + ' ' + day2 + ', ' + year2);
      cy.log(date2.toLocaleDateString());
      // Compare
      expect(date1 >= date2).to.eq(true);
      cy.log(date1 + ' >= ' + date2);
    }
  });
});

Then('the user views more than 10 feedback records on feedback page', function () {
  feedbackObj.feedbackFeedbackTableRows().should('have.length.above', 10);
});

When('the user clicks toggle details icon on the latest feedback', function () {
  feedbackObj.feedbackFeedbackTableEyeIcons().first().shadow().find('button').click({ force: true });
});

Then('the user views feedback details with timestamp, rating, comments, technical issues', function () {
  feedbackObj
    .feedbackFeedbackTableItemDetails()
    .find('p')
    .invoke('text')
    .should('match', /Feedback was submitted for [/a-zA-Z']+ on [a-zA-Z]+ [0-9a-zA-Z]+, [0-9]+ [0-9]+:[0-9]+ [A|P]M/g);
  feedbackObj
    .feedbackFeedbackTableItemDetails()
    .find('h2')
    .then((elements) => {
      expect(elements.length).to.gte(2);
      if (elements.length == 3) {
        expect(elements[0].outerText).to.eq('Rating');
        expect(elements[1].outerText).to.eq('Comments');
        expect(elements[2].outerText).to.eq('Technical issues');
      } else if (elements.length == 2) {
        expect(elements[0].outerText).to.eq('Rating');
        expect(elements[1].outerText).to.eq('Comments');
      }
    });
});

When('the user clicks Expand view button on feedback page', function () {
  feedbackObj.feedbackFeedbackExpandViewButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then(
  'the user views an expanded view of a feedback list with Date submitted, Page, Rating, Comment, Issue columns',
  function () {
    feedbackObj.feedbackFeedbackTableHeadersExpandedView().then((elements) => {
      expect(elements[0].outerText).to.eq('Date submitted');
      expect(elements[1].outerText).to.eq('Page');
      expect(elements[2].outerText).to.eq('Rating');
      expect(elements[3].outerText).to.eq('Comment');
      expect(elements[4].outerText).to.eq('Issue');
    });
  }
);

Then('the user views Stard date and End date filters on the expanded view for feedback', function () {
  feedbackObj.feedbackFeedbackStartDateFilterExpandedView().shadow().find('input').should('be.enabled');
  feedbackObj.feedbackFeedbackEndDateFilterExpandedView().shadow().find('input').should('be.enabled');
});

Then('the user views an Export CSV button on the expanded view for feedback', function () {
  feedbackObj.feedbackFeedbackExportCSVExpandedView().shadow().find('button').should('be.enabled');
});

When('the user clicks Back to default view button on the expanded view', function () {
  feedbackObj.feedbackFeedbackBackToDefaultViewButton().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

When('the user clicks Collapse view button on the expanded view', function () {
  feedbackObj.feedbackFeedbackCollapseViewButtonExpendedView().shadow().find('button').click({ force: true });
  cy.wait(2000);
});
