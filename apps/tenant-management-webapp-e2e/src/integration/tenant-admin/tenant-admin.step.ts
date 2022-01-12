import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import tenantAdminPage from './tenant-admin.page';
import dayjs = require('dayjs');

const tenantAdminObj = new tenantAdminPage();
let responseObj: Cypress.Response<any>;

Given('the user goes to tenant management login link', function () {
  const urlToTenantLogin = Cypress.config().baseUrl + '/' + Cypress.env('realm') + '/autologin?kc_idp_hint=';
  cy.visit(urlToTenantLogin);
  cy.wait(2000); // Wait all the redirects to settle down
});

Then('the tenant management admin page is displayed', function () {
  cy.url().should('include', '/admin');
  tenantAdminObj.dashboardTitle().contains('Tenant management');
  tenantAdminObj.dashboardServicesMenuCategory();
});

Then('the {string} landing page is displayed', function (pageTitle) {
  let urlPart = 'undefined';
  switch (pageTitle) {
    case 'File services':
      urlPart = '/admin/services/files';
      break;
    case 'Service status':
      urlPart = '/admin/services/status';
      break;
    case 'Event log':
      urlPart = '/admin/event-log';
      break;
    default:
      expect(pageTitle).to.be.oneOf(['File services', 'Service status', 'Event log']);
  }
  cy.url().should('include', urlPart);
  tenantAdminObj.servicePageTitle(pageTitle).then((title) => {
    expect(title.length).to.be.gt(0); // element exists
  });
});

When('the user sends a configuration service request to {string}', function (request) {
  const requestURL = Cypress.env('tenantManagementApi') + request;
  cy.request({
    method: 'GET',
    url: requestURL,
    failOnStatusCode: false,
    auth: {
      bearer: Cypress.env('autotest-admin-token'),
    },
  }).then(function (response) {
    responseObj = response;
  });
});

Then('the user gets a list of {string}', function (options) {
  switch (options) {
    case 'Service Options':
      expect(responseObj.status).to.eq(200);
      expect(responseObj.body.results).to.be.a('array');
      break;
    case 'Tenant Configurations':
      switch (responseObj.status) {
        case 200:
          expect(responseObj.body.configurationSettingsList).to.not.equal(null);
          break;
        case 404: //The case that the tenant was created without any service set up for it
          expect(responseObj.body.error.message).contains('not found');
          break;
        default:
          expect(responseObj.status).to.be.oneOf([200, 404]);
      }
      break;
    default:
      expect(options).to.be.oneOf(['Service Options', 'Tenant Configurations']);
  }
});

Then('the user views a link for the Keycloak admin', function () {
  tenantAdminObj.keycloakLink().should('have.class', 'link-button');
});

// Cypress doesn't support multi-tabs. Therefore, the validation is done on the element itself
// as recommended by Cypress: https://docs.cypress.io/guides/references/trade-offs.html#Multiple-tabs
Then('the keycloak admin link can open tenant admin portal in a new tab', function () {
  // Validate href to match the pattern, i.e. https://access-uat.alpha.alberta.ca/auth/admin/{realm}/console
  const hrefPrefix = Cypress.env('accessManagementApi') + '/admin';
  const hrefRegexString = new RegExp(hrefPrefix + '/[^/]+/console');
  tenantAdminObj.keycloakLink().should('have.attr', 'href').and('match', hrefRegexString);
  // Validate the link has target="_blank" aka link opens in a new tab
  tenantAdminObj.keycloakLink().should('have.attr', 'target', '_blank');
});

Then('the user views the number of users in its tenant realm', function () {
  // Verify user count is present
  tenantAdminObj
    .userCount()
    .invoke('text')
    .then((userCount) => {
      expect(parseInt(userCount)).to.be.least(0);
    });
  // Verify user count text is next to the count
  tenantAdminObj
    .userCount()
    .parent()
    .invoke('text')
    .then((userCountText) => {
      expect(userCountText).includes('Total number of users');
    });
  // Verify role count is present
  tenantAdminObj
    .roleCount()
    .invoke('text')
    .then((roleCount) => {
      expect(parseInt(roleCount)).to.be.least(0);
    });
  // Verify role count text is next to the role count
  tenantAdminObj
    .roleCount()
    .parent()
    .invoke('text')
    .then((roleCountText) => {
      expect(roleCountText).includes('Types of user roles');
    });
  // Verify active user count is present
  tenantAdminObj
    .activeUserCount()
    .invoke('text')
    .then((activeUserCount) => {
      expect(parseInt(activeUserCount)).to.be.least(0);
    });
  // Verify active user count text is next to the active user count
  tenantAdminObj
    .activeUserCount()
    .parent()
    .invoke('text')
    .then((activeUserText) => {
      expect(activeUserText).includes('Active users');
    });
});

Then('the number of users from admin page should equal to the number of users from the realm API', function () {
  let numOfUsers;
  let numOfRoles;
  let numOfActiveUsers;
  let count = 0;

  // Get numbers for users, roles and active users
  tenantAdminObj
    .userCount()
    .invoke('text')
    .then(function (numberString) {
      numOfUsers = Number(numberString);
    });
  tenantAdminObj
    .roleCount()
    .invoke('text')
    .then(function (numberString) {
      numOfRoles = Number(numberString);
    });
  tenantAdminObj
    .activeUserCount()
    .invoke('text')
    .then(function (numberString) {
      numOfActiveUsers = Number(numberString);
    });

  // Get numbers from keycloak APIs
  const requestURLUsers = Cypress.env('accessManagementApi') + '/admin/realms/' + Cypress.env('realm') + '/users';
  const requestURLRoles = Cypress.env('accessManagementApi') + '/admin/realms/' + Cypress.env('realm') + '/roles';
  cy.request({
    method: 'GET',
    url: requestURLUsers,
    auth: {
      bearer: Cypress.env('autotest-admin-token'),
    },
  }).then(function (response) {
    expect(response.body.length).equals(numOfUsers);
    for (let arrayIndex = 0; arrayIndex < response.body.length; arrayIndex++) {
      if (response.body[arrayIndex].enabled == true) {
        count = count + 1;
      }
    }
    expect(count).equals(numOfActiveUsers);
  });
  cy.request({
    method: 'GET',
    url: requestURLRoles,
    auth: {
      bearer: Cypress.env('autotest-admin-token'),
    },
  }).then(function (response) {
    expect(response.body.length).equals(numOfRoles);
  });
});

Then('the user views the number of users in top 5 roles in its tenant realm', function () {
  const userNum = new Array(5);
  // Verify roles table headers
  tenantAdminObj
    .roleTableHead()
    .find('th')
    .eq(0)
    .invoke('text')
    .then(function (header1) {
      expect(header1).to.equal('User role');
    });
  tenantAdminObj
    .roleTableHead()
    .find('th')
    .eq(1)
    .invoke('text')
    .then(function (header2) {
      expect(header2).to.equal('Role count');
    });

  // Verify <= 5 rows in the table and roles with descending numbers
  let numOfRows;
  tenantAdminObj
    .roleTableBody()
    .children()
    .then(function (rows) {
      numOfRows = rows.length;
      expect(numOfRows).is.not.greaterThan(5);
      for (let row = 0; row < numOfRows; row++) {
        tenantAdminObj
          .roleTableBody()
          .find('tr')
          .eq(row)
          .find('td')
          .eq(1)
          .invoke('text')
          .then(function (roleUserNum) {
            userNum[row] = Number(roleUserNum);
            if (row > 0) {
              expect(userNum[row]).to.be.not.greaterThan(userNum[row - 1]);
            }
          });
      }
    });
});

function sortDictionary(Dict) {
  const items = Object.keys(Dict).map(function (key) {
    return [key, Dict[key]];
  });
  items.sort(function (first, second) {
    return second[1] - first[1];
  });
  const sortedObj = {};
  items.forEach(function (pair) {
    sortedObj[pair[0]] = pair[1];
  });
  return sortedObj;
}

Then(
  'the number of users in roles from admin page should equal to the number of users in roles from the realm API',
  function () {
    const roleUserNumUI = {};
    let numOfRolesUI;
    const userNum = new Array(5);
    const roleName = new Array(5);
    const roleUserNumApi = {};
    let sortedRoleUserNumApi;
    let sortedRoleUserNumApiArray;
    let roleUserNumUIArray;
    const requestURLRoles = Cypress.env('accessManagementApi') + '/admin/realms/' + Cypress.env('realm') + '/roles';
    let numOfRolesApi;
    let requestURLRoleUsers;

    // Get role stats from UI
    tenantAdminObj
      .roleTableBody()
      .find('tr')
      .then(function (rows) {
        numOfRolesUI = rows.length;
        expect(numOfRolesUI).to.be.most(5);
        for (let row = 0; row < numOfRolesUI; row++) {
          tenantAdminObj
            .roleTableBody()
            .find('tr')
            .eq(row)
            .find('td')
            .eq(0)
            .invoke('text')
            .then(function (name) {
              roleName[row] = name;
            });
          tenantAdminObj
            .roleTableBody()
            .find('tr')
            .eq(row)
            .find('td')
            .eq(1)
            .invoke('text')
            .then(function (num) {
              userNum[row] = Number(num);
              roleUserNumUI[roleName[row]] = userNum[row];
              if (row == numOfRolesUI - 1) {
                Cypress.log({ name: 'Role stats from UI', message: JSON.stringify(roleUserNumUI) });
              }
            });
        }
      });

    // Get and sort role stats from keycloak, and compare with the stats from UI
    cy.request({
      method: 'GET',
      url: requestURLRoles,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
    })
      .then(function (response) {
        numOfRolesApi = response.body.length;
        expect(numOfRolesApi).to.be.not.lessThan(numOfRolesUI);
        for (let arrayIndex = 0; arrayIndex < numOfRolesApi; arrayIndex++) {
          requestURLRoleUsers =
            Cypress.env('accessManagementApi') +
            '/admin/realms/' +
            Cypress.env('realm') +
            '/roles/' +
            response.body[arrayIndex].name +
            '/users';
          cy.request({
            method: 'GET',
            url: requestURLRoleUsers,
            auth: {
              bearer: Cypress.env('autotest-admin-token'),
            },
          }).then(function (response2) {
            // Only count non-service users
            let counter = 0;
            for (let i = 0; i < response2.body.length; i++) {
              const userData = response2.body[i];
              if (!userData.username.includes('service-account')) {
                counter = counter + 1;
              }
            }
            roleUserNumApi[response.body[arrayIndex].name] = counter;
          });
        }
      })
      .then(function () {
        Cypress.log({ name: 'Role stats from API', message: JSON.stringify(roleUserNumApi) });
        sortedRoleUserNumApi = sortDictionary(roleUserNumApi);
        Cypress.log({ name: 'Sorted role stats from API', message: JSON.stringify(sortedRoleUserNumApi) });
        sortedRoleUserNumApiArray = Object.entries(sortedRoleUserNumApi).slice(0, numOfRolesUI); // Trim the role user stats from api and convert to array for comparison
        roleUserNumUIArray = Object.entries(roleUserNumUI); // Convert dict to array for comparison
        assert.deepEqual(sortedRoleUserNumApiArray, roleUserNumUIArray);
      });
  }
);

Then('the user views the tenant name of {string}', function (tenantName) {
  tenantAdminObj.tenantName().should('have.text', tenantName);
});

Then('the user views the release info and DIO contact info', function () {
  tenantAdminObj
    .releaseContactInfo()
    .invoke('text')
    .then((text) => {
      expect(text).to.match(/This service is in .+ release.+ DIO@gov.ab.ca/g);
    });
});

Then('the user views the autologin link with a copy button', function () {
  tenantAdminObj
    .tenantAutoLoginUrl()
    .should('contain.text', Cypress.config().baseUrl + '/' + Cypress.env('realm') + '/autologin');
  tenantAdminObj.clickToCopyButton().then((button) => {
    expect(button.length).to.be.gt(0); // button element exists
  });
});

When('the user clicks click to copy button', function () {
  tenantAdminObj.clickToCopyButton().click();
  cy.wait(2000);
});

Then('the autologin link is copied to the clipboard', function () {
  cy.task('getClipboard').should('eq', Cypress.config().baseUrl + '/' + Cypress.env('realm') + '/autologin');
});

Then(
  'the user views introductions and links for {string}, {string}, {string}, {string} and {string}',
  function (access, fileService, status, events, notifications) {
    const cardTextArray = [
      'Access allows',
      'The file service provides',
      'The status service allows',
      'The event service provides',
      '',
    ];
    const cardTitleArray = [access, fileService, status, events, notifications];
    tenantAdminObj.goaCardTexts().should('have.length', cardTextArray.length);
    tenantAdminObj.goaCardTitles().should('have.length', cardTitleArray.length);
    tenantAdminObj.goaCardTexts().each((element, index) => {
      cy.wrap(element).invoke('text').should('contain', cardTextArray[index]);
    });
    tenantAdminObj.goaCardTitles().each((element, index) => {
      cy.wrap(element).invoke('text').should('contain', cardTitleArray[index]);
    });
  }
);

When('the user clicks {string} link', function (link) {
  tenantAdminObj.goaCardLink(link).click();
  cy.wait(2000);
});

Then('the user is directed to {string} page', function (page) {
  tenantAdminObj.servicePageTitle(page);
});

Then('the user views an instruction of role requirement indicating user needs tenant-admin', function () {
  // Verify the instruction mentions the tenant-admin role
  tenantAdminObj
    .roleInstructionParagragh()
    .invoke('text')
    .then((text) => {
      expect(text).to.contain('tenant-admin');
    });
  // Verify the here link is correct
  tenantAdminObj
    .hereLinkForManageUsers()
    .invoke('attr', 'href')
    .then((href) => {
      expect(href).to.contain(
        Cypress.env('accessManagementApi') +
          '/admin/' +
          Cypress.env('realm') +
          '/console/#/realms/' +
          Cypress.env('realm') +
          '/users'
      );
    });
});

Then(
  'the user views a message stating the user needs administrator role for the tenant to access the app and that they can contact the tenant creator of {string}',
  function (ownerEmail) {
    tenantAdminObj.dashboardCalloutContenth3Title().should('contain.text', 'requires tenant-admin role');
    // Get owner email
    let email = '';
    const envOwnerEmail = ownerEmail.match(/(?<={).+(?=})/g);
    if (envOwnerEmail == '') {
      email = ownerEmail;
    } else {
      email = Cypress.env(String(envOwnerEmail));
    }
    tenantAdminObj.dashboardCalloutContentEmail().should('contain.text', email);
    tenantAdminObj
      .dashboardCalloutContentEmail()
      .should('have.attr', 'href')
      .then((href) => {
        expect(href).to.contain(email);
      });
  }
);

Then('the user should not have regular admin view', function () {
  tenantAdminObj.dashboardServicesMenuCategory().should('not.exist');
});

When('the user searches with {string}', function (namespaceName) {
  tenantAdminObj.eventLogSearchBox().click();
  tenantAdminObj.eventLogSearchBox().type(namespaceName).click();
  tenantAdminObj.eventLogSearchBox().should('have.value', namespaceName);
  tenantAdminObj.eventLogSearchBtn().click();
});

Then('the user views the events matching the search filter of {string}', function (namespaceName) {
  tenantAdminObj
    .eventTableBody()
    .contains(namespaceName.split(':')[0])
    .parent()
    .within(function () {
      cy.get('td').eq(2).should('contain.text', namespaceName.split(':')[1]);
    });

  tenantAdminObj.eventTableBody().each(($row) => {
    cy.wrap($row).within(() => {
      cy.get('td').each(($col) => {
        if ($col.eq(1).text() == namespaceName.split(':')[0]) {
          throw new Error('Record not found');
        }
        if ($col.eq(2).text() == namespaceName.split(':')[1]) {
          throw new Error('Record not found');
        }
      });
    });
  });
});

When('the user clicks Load more button', function () {
  tenantAdminObj.eventLoadMoreBtn().click();
  cy.wait(1000);
});

Then('the user views more events matching the search filter of {string}', function (namespaceName) {
  tenantAdminObj.eventTableBody().each(($row) => {
    cy.wrap($row).within(() => {
      cy.get('td').each(($row) => {
        if ($row.eq(1).text() == namespaceName.split(':')[0]) {
          throw new Error('Record not found');
        }
        if ($row.eq(2).text() == namespaceName.split(':')[1]) {
          throw new Error('Record not found');
        }
      });
    });
  });
  tenantAdminObj.eventTableBody().children().should('have.length.greaterThan', 10);
});
//dayjs is date time utility to format the date time
//replace "now-5mins" with "2022-01-09T04:02" to input absolute timestamp as static date and time
function timeChanger(dateTime) {
  if (
    String(dateTime).match(/[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/)
  ) {
    return dateTime;
  } else {
    const addedMins = String(dateTime).substring(
      String(dateTime).search(/([+-])([0-9])/),
      String(dateTime).search(/mins/)
    );
    const minInput = addedMins.replace(/([a-zA-Z])/g, ''); //
    const minChange = parseInt(minInput);
    const finalTime = dayjs().add(minChange, 'minutes').format('YYYY-MM-DD HH:mm');
    const finalDate = finalTime.split(' ')[0] + 'T' + finalTime.split(' ')[1];
    return finalDate;
  }
}

When('the user searches with {string} as minimum timestamp, {string} as maximum timestamp', function (submin, addmin) {
  //replace "now-5mins" with "2022-01-09T04:02" to input absolute timestamp as static date and time
  expect(submin).to.match(
    /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
  );
  expect(addmin).to.match(
    /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
  );

  const timestampMin = timeChanger(submin);
  const timestampMax = timeChanger(addmin);

  cy.log(timestampMin);
  cy.log(timestampMax);

  tenantAdminObj.eventLogMinTimesStamp().type(timestampMin);
  tenantAdminObj.eventLogMaxTimesStamp().type(timestampMax);
  tenantAdminObj.eventLogSearchBtn().click();
});

Then('the user views the events matching the search filter of min and max timestamp', function () {
  tenantAdminObj
    .eventLogMinTimesStamp()
    .invoke('val')
    .then((val) => {
      const timestampMin = String(val);

      tenantAdminObj
        .eventLogMaxTimesStamp()
        .invoke('val')
        .then((val) => {
          const timestampMax = String(val);

          //parse date, time from min, max and table
          tenantAdminObj
            .eventTableBody()
            .parent()
            .within(function () {
              cy.get('td')
                .eq(0)
                .then((elem) => {
                  const tableDateTime = elem.text();
                  const tableLastSlash = tableDateTime.lastIndexOf('/');
                  const tableDate = tableDateTime.substring(0, tableLastSlash + 5);
                  const tableTime = tableDateTime.substring(tableLastSlash + 5, tableDateTime.length + 1);
                  const parseDateTime = dayjs(tableDate + ' ' + tableTime, 'MM/DD/YYYY HH:mm:ss A');
                  const minTimestamp = dayjs(
                    timestampMin.split('T')[0] + ' ' + timestampMin.split('T')[1],
                    'YYYY-MM-DD hh:mm'
                  );
                  const maxTimestamp = dayjs(
                    timestampMax.split('T')[0] + ' ' + timestampMax.split('T')[1],
                    'YYYY-MM-DD hh:mm'
                  );
                  cy.log(minTimestamp + '');
                  cy.log(maxTimestamp + '');
                  cy.log(parseDateTime + '');
                  //comparing table timestamp with the min and max values
                  expect(parseInt(parseDateTime + '')).to.be.gte(parseInt(minTimestamp + ''));
                  expect(parseInt(parseDateTime + '')).to.be.lte(parseInt(maxTimestamp + ''));
                });
            });
        });
    });
});

When('the user searches with {string} as minimum timestamp', function (submin) {
  const timestampMin = timeChanger(submin);
  cy.log(timestampMin);

  tenantAdminObj.eventLogMinTimesStamp().type(timestampMin);
  tenantAdminObj.eventLogSearchBtn().click();
});

Then('the user views the events matching the search filter of min timestamp', function () {
  tenantAdminObj
    .eventLogMinTimesStamp()
    .invoke('val')
    .then((val) => {
      const timestampMin = String(val);

      tenantAdminObj
        .eventTableBody()
        .parent()
        .within(function () {
          cy.get('td')
            .eq(0)
            .then((elem) => {
              const tableDateTime = elem.text();
              const tableLastSlash = tableDateTime.lastIndexOf('/');
              const tableDate = tableDateTime.substring(0, tableLastSlash + 5);
              const tableTime = tableDateTime.substring(tableLastSlash + 5, tableDateTime.length + 1);
              const parseDateTime = dayjs(tableDate + ' ' + tableTime, 'MM/DD/YYYY HH:mm:ss A');
              const minTimestamp = dayjs(
                timestampMin.split('T')[0] + ' ' + timestampMin.split('T')[1],
                'YYYY-MM-DD hh:mm'
              );

              cy.log(minTimestamp + '');
              cy.log(parseDateTime + '');

              expect(parseInt(parseDateTime + '')).to.be.gte(parseInt(minTimestamp + ''));
            });
        });
    });
});

When('the user searches with {string} as maximum timestamp', function (addmin) {
  const timestampMax = timeChanger(addmin);
  cy.log(timestampMax);

  tenantAdminObj.eventLogMaxTimesStamp().type(timestampMax);
  tenantAdminObj.eventLogSearchBtn().click();
});

Then('the user views the events matching the search filter of maximum timestamp', function () {
  tenantAdminObj
    .eventLogMaxTimesStamp()
    .invoke('val')
    .then((val) => {
      const timestampMax = String(val);

      tenantAdminObj
        .eventTableBody()
        .parent()
        .within(function () {
          cy.get('td')
            .eq(0)
            .then((elem) => {
              const tableDateTime = elem.text();
              const tableLastSlash = tableDateTime.lastIndexOf('/');
              const tableDate = tableDateTime.substring(0, tableLastSlash + 5);
              const tableTime = tableDateTime.substring(tableLastSlash + 5, tableDateTime.length + 1);
              const parseDateTime = dayjs(tableDate + ' ' + tableTime, 'MM/DD/YYYY HH:mm:ss A');
              const maxTimestamp = dayjs(
                timestampMax.split('T')[0] + ' ' + timestampMax.split('T')[1],
                'YYYY-MM-DD hh:mm'
              );

              cy.log(maxTimestamp + '');
              cy.log(parseDateTime + '');

              expect(parseInt(parseDateTime + '')).to.be.lte(parseInt(maxTimestamp + ''));
            });
        });
    });
});

When(
  'the user searches with {string}, {string} as minimum timestamp, {string} as maximum timestamp',
  function (namespaceName, submin, addmin) {
    tenantAdminObj.eventLogSearchBox().click();
    tenantAdminObj.eventLogSearchBox().type(namespaceName).click();

    const timestampMin = timeChanger(submin);
    const timestampMax = timeChanger(addmin);

    cy.log(timestampMin);
    cy.log(timestampMax);

    tenantAdminObj.eventLogMinTimesStamp().type(timestampMin);
    tenantAdminObj.eventLogMaxTimesStamp().type(timestampMax);

    tenantAdminObj.eventLogSearchBtn().click();
  }
);
Then(
  'the user views the events matching the search filter of {string} and timestamp value between min and max timestamps',
  function (namespaceName) {
    tenantAdminObj.eventTableBody().each(($row) => {
      cy.wrap($row).within(() => {
        cy.get('td').each(($row) => {
          if ($row.eq(1).text() == namespaceName.split(':')[0]) {
            throw new Error('Record not found');
          }
          if ($row.eq(2).text() == namespaceName.split(':')[1]) {
            throw new Error('Record not found');
          }
        });
      });
      tenantAdminObj
        .eventLogMinTimesStamp()
        .invoke('val')
        .then((val) => {
          const timestampMin = String(val);

          tenantAdminObj
            .eventLogMaxTimesStamp()
            .invoke('val')
            .then((val) => {
              const timestampMax = String(val);

              //parse date, time from min, max and table
              tenantAdminObj
                .eventTableBody()
                .parent()
                .within(function () {
                  cy.get('td')
                    .eq(0)
                    .then((elem) => {
                      const tableDateTime = elem.text();
                      const tableLastSlash = tableDateTime.lastIndexOf('/');
                      const tableDate = tableDateTime.substring(0, tableLastSlash + 5);
                      const tableTime = tableDateTime.substring(tableLastSlash + 5, tableDateTime.length + 1);
                      const parseDateTime = dayjs(tableDate + ' ' + tableTime, 'MM/DD/YYYY HH:mm:ss A');
                      const minTimestamp = dayjs(
                        timestampMin.split('T')[0] + ' ' + timestampMin.split('T')[1],
                        'YYYY-MM-DD hh:mm'
                      );
                      const maxTimestamp = dayjs(
                        timestampMax.split('T')[0] + ' ' + timestampMax.split('T')[1],
                        'YYYY-MM-DD hh:mm'
                      );
                      cy.log(minTimestamp + '');
                      cy.log(maxTimestamp + '');
                      cy.log(parseDateTime + '');
                      //comparing table timestamp with the min and max values
                      expect(parseInt(parseDateTime + '')).to.be.gte(parseInt(minTimestamp + ''));
                      expect(parseInt(parseDateTime + '')).to.be.lte(parseInt(maxTimestamp + ''));
                    });
                });
            });
        });
    });
  }
);

Then('the user resets event log views', function () {
  tenantAdminObj.eventLogResetBtn().click();
});
