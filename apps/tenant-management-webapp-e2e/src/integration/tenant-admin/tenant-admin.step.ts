import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import tenantAdminPage from './tenant-admin.page';
import commonPage from '../common/common.page';
import commonlib from '../common/common-library';
import WelcomPage from '../welcome-page/welcome.page';
import dayjs = require('dayjs');

const tenantAdminObj = new tenantAdminPage();
const commonObj = new commonPage();
const welcomPageObj = new WelcomPage();
let responseObj: Cypress.Response<any>;
let numOfRows: number;

Given('the user goes to tenant management login link', function () {
  const urlToTenantLogin = Cypress.config().baseUrl + '/' + Cypress.env('realm') + '/login?kc_idp_hint=';
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
    case 'File service':
      urlPart = '/admin/services/file';
      break;
    case 'Status service':
      urlPart = '/admin/services/status';
      break;
    case 'Event log':
      urlPart = '/admin/event-log';
      break;
    default:
      expect(pageTitle).to.be.oneOf(['File service', 'Status service', 'Event log']);
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
  tenantAdminObj.keycloakLink().should('have.attr', 'href');
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
  tenantAdminObj.keycloakLinkOpenIcon().should('exist');
});

Then('the user views the number of users in its tenant realm', function () {
  cy.wait(4000); //Wait for stats to show up
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
      expect(roleCountText).includes('Total number of roles');
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
    count = 0;
    for (let arrayIndex = 0; arrayIndex < response.body.length; arrayIndex++) {
      if (!response.body[arrayIndex].name.includes('default-roles')) {
        count = count + 1;
      }
    }
    expect(count).equals(numOfRoles);
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
      expect(header1).to.equal('Role');
    });
  tenantAdminObj
    .roleTableHead()
    .find('th')
    .eq(1)
    .invoke('text')
    .then(function (header2) {
      expect(header2).to.equal('User count');
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
          if (!response.body[arrayIndex].name.includes('default-roles')) {
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

When('the user clicks Copy login link', function () {
  tenantAdminObj.copyLoginLinkButton().shadow().find('button').scrollIntoView().trigger('mouseover');
});

Then('the user views the message of {string} from clicking Copy login link', function (message) {
  tenantAdminObj
    .copyLoginLinkButtonMessage()
    .invoke('text')
    .then((msg) => {
      expect(msg).to.contain(message);
    });
});

Then('the login link is copied to the clipboard', function () {
  cy.task('getClipboard').should('eq', Cypress.config().baseUrl + '/' + Cypress.env('realm') + '/login');
});

Then(
  'the user views introductions and links for {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}, {string}',
  function (
    access,
    calendar,
    comment,
    configuration,
    directory,
    events,
    feedback,
    file,
    form,
    notification,
    pdf,
    script,
    status,
    task
  ) {
    const cardTextArray = [
      'Access allows',
      'The calendar service provides',
      'Comment service',
      'The configuration service provides',
      'The directory service is',
      'The event service provides',
      'The feedback service provides',
      'The file service provides',
      'The form service provides',
      'The notifications service provides',
      'The PDF service provides',
      'The script services provides',
      'The status service allows',
      'The task service provides',
    ];
    const cardTitleArray = [
      access,
      calendar,
      comment,
      configuration,
      directory,
      events,
      feedback,
      file,
      form,
      notification,
      pdf,
      script,
      status,
      task,
    ];
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
  tenantAdminObj.servicePageTitle(page).should('exist');
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
    tenantAdminObj.dashboardCallout().shadow().find('h3').should('contain.text', 'requires tenant-admin role');
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
  tenantAdminObj.eventLogSearchBox().type(namespaceName);
  tenantAdminObj.eventLogSearchBox().should('have.value', namespaceName);
  tenantAdminObj.eventLogSearchBtn().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then('the user views the events matching the search filter of {string}', function (namespaceName) {
  tenantAdminObj.eventTableBody().each(($row) => {
    cy.wrap($row).within(() => {
      cy.get('td').each(($col) => {
        if ($col.eq(2).text() == namespaceName.split(':')[0]) {
          expect($col.eq(2).text()).to.equal(namespaceName.split(':')[0]);
        }
        if ($col.eq(3).text() == namespaceName.split(':')[1]) {
          expect($col.eq(3).text()).to.equal(namespaceName.split(':')[1]);
        }
      });
    });
  });
});

When('the user clicks Load more button on event log page', function () {
  // count numbers of row in the table before clicking Load more...
  tenantAdminObj
    .eventTableBody()
    .find('tr')
    .then((elm) => {
      numOfRows = Number(elm.length);
    });
  tenantAdminObj.eventLoadMoreBtn().shadow().find('button').click({ force: true });
  cy.wait(4000);
});

Then('the user views more events matching the search filter of {string}', function (namespaceName) {
  // count numbers of row in the table after clicking Load more... than compare the count
  tenantAdminObj
    .eventTableBody()
    .find('tr')
    .then((tableRowsAfterLoadMore) => {
      expect(tableRowsAfterLoadMore.length).to.be.gt(numOfRows);
    });

  tenantAdminObj.eventTableBody().each(($row) => {
    cy.wrap($row).within(() => {
      cy.get('td').each(($col) => {
        if ($col.eq(2).text() == namespaceName.split(':')[0]) {
          expect($col.eq(2).text()).to.equal(namespaceName.split(':')[0]);
        }
        if ($col.eq(3).text() == namespaceName.split(':')[1]) {
          expect($col.eq(3).text()).to.equal(namespaceName.split(':')[1]);
        }
      });
    });
  });
});

//dayjs is date time utility to format the date time
//replace "now-5mins" with "2022-01-09T04:02" to input absolute timestamp as static date and time
//checking and converting datetime into the string to check if it is static time or now-+mins format
//in case if it is static
function timestampUtil(dateTime) {
  if (
    String(dateTime).match(/[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/)
  ) {
    //if static datetime used as an input, use following format "2022-01-07T04:02"
    return dateTime;
  } else if (String(dateTime).match(/now([-+])([0-9]+)mins/)) {
    //if it is not static datetime we need to parse to match input field +- mins, use following format "now+-5mins"
    const addedMins = String(dateTime).substring(
      String(dateTime).search(/([+-])([0-9])/),
      String(dateTime).search(/mins/)
    );
    const minInput = addedMins.replace(/([a-zA-Z])/g, '');
    const minChange = parseInt(minInput);
    const finalTime = dayjs().add(minChange, 'minutes').second(0).format('YYYY-MM-DD HH:mm'); //it will add or subtract, force the seconds to be 00.

    const finalDate = finalTime.split(' ')[0] + 'T' + finalTime.split(' ')[1];
    return finalDate;
  } else {
    expect(String(dateTime)).to.match(
      /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
    );
  }
}

When('the user searches with {string} as minimum timestamp, {string} as maximum timestamp', function (submin, addmin) {
  //for example replace "now-+5mins" with "2022-01-09T04:02" to input absolute timestamp as static date and time
  expect(submin).to.match(
    /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
  );
  expect(addmin).to.match(
    /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
  );
  const timestampMin = timestampUtil(submin);
  const timestampMax = timestampUtil(addmin);

  cy.log(timestampMin);
  cy.log(timestampMax);

  tenantAdminObj.eventLogMinTimeStamp().type(timestampMin);
  tenantAdminObj.eventLogMaxTimeStamp().type(timestampMax);
  tenantAdminObj.eventLogSearchBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then(
  'the user views the events matching the search filter of {string} as min and {string} as max timestamps',
  function (minTimestamp, maxTimestamp) {
    expect(minTimestamp).to.match(
      /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
    );
    expect(maxTimestamp).to.match(
      /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
    );
    let userMinTimestamp = timestampUtil(minTimestamp);
    let userMaxTimestamp = timestampUtil(maxTimestamp);

    // Double check if passed in time are the same as UI search timestamps; if not, i.e. now+1min is a minute later than UI max timestamp, UI search timestamps should be used
    // For example: search with now+1min may have the time of 1:10 (59th second) and validation with now+1min may be 1:11(1st second), which is 2 second later.
    let searchMinTimestamp;
    tenantAdminObj
      .eventLogMinTimeStamp()
      .invoke('attr', 'value')
      .then((value) => {
        searchMinTimestamp = value;
        cy.log('search minimum timestamp: ' + searchMinTimestamp);
        cy.log('user validation minimum timestamp: ' + userMinTimestamp);
        if (userMinTimestamp != searchMinTimestamp && searchMinTimestamp.includes('T')) {
          userMinTimestamp = searchMinTimestamp;
        }
      });
    let searchMaxTimestamp;
    tenantAdminObj
      .eventLogMaxTimeStamp()
      .invoke('attr', 'value')
      .then((value) => {
        searchMaxTimestamp = value;
        cy.log('search maximum timestamp: ' + searchMaxTimestamp);
        cy.log('user validation maximum timestamp: ' + userMaxTimestamp);
        if (userMaxTimestamp != searchMaxTimestamp && searchMaxTimestamp.includes('T')) {
          userMaxTimestamp = searchMaxTimestamp;
        }
      });

    //checking each element from the first column
    tenantAdminObj
      .eventTableBody()
      .find('td:nth-child(2)')
      .each(($elem) => {
        const tableDateTime = $elem.text();
        const tableLastSlash = tableDateTime.lastIndexOf('/');
        const tableDate = tableDateTime.substring(0, tableLastSlash + 5);
        const tableTime = tableDateTime.substring(tableLastSlash + 5, tableDateTime.length + 1);
        const parseDateTime = dayjs(tableDate + ' ' + tableTime, 'MM/DD/YYYY HH:mm:ss A');
        const tableMinTimestamp = dayjs(
          String(userMinTimestamp).split('T')[0] + ' ' + String(userMinTimestamp).split('T')[1],
          'YYYY-MM-DD hh:mm'
        );
        const tableMaxTimestamp = dayjs(
          userMaxTimestamp.split('T')[0] + ' ' + userMaxTimestamp.split('T')[1],
          'YYYY-MM-DD hh:mm'
        );
        //comparing table timestamp with the min and max values
        expect(parseInt(parseDateTime + '')).to.be.gte(parseInt(tableMinTimestamp + ''));
        expect(parseInt(parseDateTime + '')).to.be.lte(parseInt(tableMaxTimestamp + ''));
      });
  }
);

When('the user searches with {string} as minimum timestamp', function (submin) {
  const timestampMin = timestampUtil(submin);
  cy.log(timestampMin);

  tenantAdminObj.eventLogMinTimeStamp().type(timestampMin);
  tenantAdminObj.eventLogSearchBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views the events matching the search filter of {string} as min timestamp', function (minTimestamp) {
  expect(minTimestamp).to.match(
    /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
  );
  let userTimestamp = timestampUtil(minTimestamp);

  // Double check if passed in time are the same as UI search timestamps; if not, i.e. now+1min is a minute later than UI max timestamp, UI search timestamps should be used
  // For example: search with now+1min may have the time of 1:10 (59th second) and validation with now+1min may be 1:11(1st second), which is 2 second later.
  let searchMinTimestamp;
  tenantAdminObj
    .eventLogMinTimeStamp()
    .invoke('attr', 'value')
    .then((value) => {
      searchMinTimestamp = value;
      cy.log('search minimum timestamp: ' + searchMinTimestamp);
      cy.log('user validation minimum timestamp: ' + userTimestamp);
      if (userTimestamp != searchMinTimestamp && searchMinTimestamp.includes('T')) {
        userTimestamp = searchMinTimestamp;
      }
    });

  //checking each element from the first column
  tenantAdminObj
    .eventTableBody()
    .find('td:nth-child(2)')
    .each(($elem) => {
      const tableDateTime = $elem.text();
      const tableLastSlash = tableDateTime.lastIndexOf('/');
      const tableDate = tableDateTime.substring(0, tableLastSlash + 5);
      const tableTime = tableDateTime.substring(tableLastSlash + 5, tableDateTime.length + 1);
      const parseDateTime = dayjs(tableDate + ' ' + tableTime, 'MM/DD/YYYY HH:mm:ss A');
      const tableTimestamp = dayjs(
        String(userTimestamp).split('T')[0] + ' ' + String(userTimestamp).split('T')[1],
        'YYYY-MM-DD hh:mm'
      );
      expect(parseInt(parseDateTime + '')).to.be.gte(parseInt(tableTimestamp + ''));
    });
});

When('the user searches with {string} as maximum timestamp', function (addmin) {
  const timestampMax = timestampUtil(addmin);
  cy.log(timestampMax);

  tenantAdminObj.eventLogMaxTimeStamp().type(timestampMax);
  tenantAdminObj.eventLogSearchBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views the events matching the search filter of {string} as maximum timestamp', function (maxTimestamp) {
  expect(maxTimestamp).to.match(
    /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
  );
  let userTimestamp = timestampUtil(maxTimestamp);

  // Double check if passed in time are the same as UI search timestamps; if not, i.e. now+1min is a minute later than UI max timestamp, UI search timestamps should be used
  // For example: search with now+1min may have the time of 1:10 (59th second) and validation with now+1min may be 1:11(1st second), which is 2 second later.
  let searchMaxTimestamp;
  tenantAdminObj
    .eventLogMaxTimeStamp()
    .invoke('attr', 'value')
    .then((value) => {
      searchMaxTimestamp = value;
      cy.log('search maximum timestamp: ' + searchMaxTimestamp);
      cy.log('user validation maximum timestamp: ' + userTimestamp);
      if (userTimestamp != searchMaxTimestamp && searchMaxTimestamp.includes('T')) {
        userTimestamp = searchMaxTimestamp;
      }
    });

  //checking each element from the first column
  tenantAdminObj
    .eventTableBody()
    .find('td:nth-child(2)')
    .each(($elem) => {
      const tableDateTime = $elem.text();
      const tableLastSlash = tableDateTime.lastIndexOf('/');
      const tableDate = tableDateTime.substring(0, tableLastSlash + 5);
      const tableTime = tableDateTime.substring(tableLastSlash + 5, tableDateTime.length + 1);
      const parseDateTime = dayjs(tableDate + ' ' + tableTime, 'MM/DD/YYYY HH:mm:ss A');
      const tableTimestamp = dayjs(
        String(userTimestamp).split('T')[0] + ' ' + String(userTimestamp).split('T')[1],
        'YYYY-MM-DD hh:mm'
      );
      expect(parseInt(parseDateTime + '')).to.be.lte(parseInt(tableTimestamp + ''));
    });
});

When(
  'the user searches with {string}, {string} as minimum timestamp, {string} as maximum timestamp',
  function (namespaceName, submin, addmin) {
    tenantAdminObj.eventLogSearchBox().click();
    tenantAdminObj.eventLogSearchBox().type(namespaceName);

    const timestampMin = timestampUtil(submin);
    const timestampMax = timestampUtil(addmin);

    cy.log(timestampMin);
    cy.log(timestampMax);

    tenantAdminObj.eventLogMinTimeStamp().type(timestampMin);
    tenantAdminObj.eventLogMaxTimeStamp().type(timestampMax);
    tenantAdminObj.eventLogSearchBtn().shadow().find('button').click({ force: true });
    cy.wait(2000);
  }
);

Then(
  'the user views the events matching the search filter of {string}, and timestamp value between {string} as min and {string} as max timestamps',
  function (namespaceName, minTimestamp, maxTimestamp) {
    tenantAdminObj.eventTableBody().each(($row) => {
      cy.wrap($row).within(() => {
        cy.get('td').each(($col) => {
          if ($col.eq(2).text() == namespaceName.split(':')[0]) {
            expect($col.eq(2).text()).to.equal(namespaceName.split(':')[0]);
          }
          if ($col.eq(3).text() == namespaceName.split(':')[1]) {
            expect($col.eq(3).text()).to.equal(namespaceName.split(':')[1]);
          }
        });
      });
    });
    expect(minTimestamp).to.match(
      /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
    );
    expect(maxTimestamp).to.match(
      /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
    );
    let userMinTimestamp = timestampUtil(minTimestamp);
    let userMaxTimestamp = timestampUtil(maxTimestamp);

    // Double check if passed in time are the same as UI search timestamps; if not, i.e. now+1min is a minute later than UI max timestamp, UI search timestamps should be used
    // For example: search with now+1min may have the time of 1:10 (59th second) and validation with now+1min may be 1:11(1st second), which is 2 second later.
    let searchMinTimestamp;
    tenantAdminObj
      .eventLogMinTimeStamp()
      .invoke('attr', 'value')
      .then((value) => {
        searchMinTimestamp = value;
        cy.log('search minimum timestamp: ' + searchMinTimestamp);
        cy.log('user validation minimum timestamp: ' + userMinTimestamp);
        if (userMinTimestamp != searchMinTimestamp && searchMinTimestamp.includes('T')) {
          userMinTimestamp = searchMinTimestamp;
        }
      });

    let searchMaxTimestamp;
    tenantAdminObj
      .eventLogMaxTimeStamp()
      .invoke('attr', 'value')
      .then((value) => {
        searchMaxTimestamp = value;
        cy.log('search maximum timestamp: ' + searchMaxTimestamp);
        cy.log('user validation maximum timestamp: ' + userMaxTimestamp);
        if (userMaxTimestamp != searchMaxTimestamp && searchMaxTimestamp.includes('T')) {
          userMaxTimestamp = searchMaxTimestamp;
        }
      });

    //checking each element from the first column
    tenantAdminObj
      .eventTableBody()
      .find('td:nth-child(2)')
      .each(($elem) => {
        const tableDateTime = $elem.text();
        const tableLastSlash = tableDateTime.lastIndexOf('/');
        const tableDate = tableDateTime.substring(0, tableLastSlash + 5);
        const tableTime = tableDateTime.substring(tableLastSlash + 5, tableDateTime.length + 1);
        const parseDateTime = dayjs(tableDate + ' ' + tableTime, 'MM/DD/YYYY HH:mm:ss A');
        const tableMinTimestamp = dayjs(
          String(userMinTimestamp).split('T')[0] + ' ' + String(userMinTimestamp).split('T')[1],
          'YYYY-MM-DD hh:mm'
        );
        const tableMaxTimestamp = dayjs(
          userMaxTimestamp.split('T')[0] + ' ' + userMaxTimestamp.split('T')[1],
          'YYYY-MM-DD hh:mm'
        );
        expect(parseInt(parseDateTime + '')).to.be.gte(parseInt(tableMinTimestamp + ''));
        expect(parseInt(parseDateTime + '')).to.be.lte(parseInt(tableMaxTimestamp + ''));
      });
  }
);

Then('the user resets event log views', function () {
  tenantAdminObj.eventLogResetBtn().shadow().find('button').click({ force: true });
  cy.wait(2000);
});

Then('the user views that search fields are empty', function () {
  tenantAdminObj.eventLogSearchBox().should('have.value', '');
  tenantAdminObj.eventLogMinTimeStamp().should('have.value', '');
  tenantAdminObj.eventLogMaxTimeStamp().should('have.value', '');
});

Then(
  'the user views that the event log is no longer filtered by {string}, {string}, {string}',
  function (namespaceName, minTimestamp, maxTimestamp) {
    expect(minTimestamp).to.match(
      /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
    );
    expect(maxTimestamp).to.match(
      /now([-+])([0-9]+)mins|[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])T(0[1-9]|1[0-9]|2[0-3]):[0-5][0-9]/
    );
    const userMinTimestamp = timestampUtil(minTimestamp);
    const userMaxTimestamp = timestampUtil(maxTimestamp);

    //checking all rows in the following columns: 1, 2, 3 in the even log table
    tenantAdminObj
      .eventTableBody()
      .find('tr')
      .each(($row) => {
        const tableTimestamp = $row.find('td').eq(1).text();
        const tableNamespace = $row.find('td').eq(2).text();
        const tableName = $row.find('td').eq(3).text();

        const tableLastSlash = tableTimestamp.lastIndexOf('/');
        const tableDate = tableTimestamp.substring(0, tableLastSlash + 5);
        const tableTime = tableTimestamp.substring(tableLastSlash + 5, tableTimestamp.length + 1);
        const parseDateTime = dayjs(tableDate + ' ' + tableTime, 'MM/DD/YYYY HH:mm:ss A');
        const tableMinTimestamp = dayjs(
          String(userMinTimestamp).split('T')[0] + ' ' + String(userMinTimestamp).split('T')[1],
          'YYYY-MM-DD hh:mm'
        );
        const tableMaxTimestamp = dayjs(
          String(userMaxTimestamp).split('T')[0] + ' ' + userMaxTimestamp.split('T')[1],
          'YYYY-MM-DD hh:mm'
        );
        if (
          !tableNamespace.includes(namespaceName.split(':')[0]) ||
          !tableName.includes(namespaceName.split(':')[1]) ||
          !(parseInt(parseDateTime + '') >= parseInt(tableMinTimestamp + '')) ||
          !(parseInt(parseDateTime + '') <= parseInt(tableMaxTimestamp + ''))
        ) {
          cy.wrap('Reset succeeded').as('errormsg');
          return false;
        }
        cy.wrap('Reset failed').as('errormsg');
      });
    cy.get('@errormsg').then((logmsg) => {
      expect(String(logmsg)).to.be.equal('Reset succeeded');
    });
  }
);

When('the user clicks Show details button for the latest event of {string} for {string}', function (name, namespace) {
  // Verify the first record matches the name and namespace
  tenantAdminObj
    .eventTableBody()
    .children('tr')
    .first()
    .within(() => {
      tenantAdminObj.eventTableNameCells().invoke('text').should('eq', name);
    });
  tenantAdminObj
    .eventTableBody()
    .children('tr')
    .first()
    .within(() => {
      tenantAdminObj.eventTableNameSpaceCells().invoke('text').should('eq', namespace);
    });

  // Verify the first toggle details icon is eye icon, not eye-off icon, and then click it
  tenantAdminObj.eventToggleDetailsIcons().first().invoke('attr', 'icon').should('eq', 'eye');
  tenantAdminObj.eventToggleDetailsIcons().first().shadow().find('button').click({ force: true });
});

// Only one event details is open before calling this step
Then(
  'the user views the event details with status changing from {string} to {string}',
  function (oldStatus, newStatus) {
    tenantAdminObj.eventDetails().then((elements) => {
      expect(elements.length).to.equal(1);
    });
    tenantAdminObj
      .eventDetails()
      .invoke('text')
      .then((eventDetails) => {
        expect(eventDetails).to.contain('"originalStatus": ' + '"' + oldStatus.toLowerCase() + '"');
        expect(eventDetails).to.contain('"newStatus": ' + '"' + newStatus.toLowerCase() + '"');
      });
  }
);

Then(
  'the user views the event details of {string}, {string}, {string}, {string}, {string}',
  function (serviceName, apiVersion, url, namespace, username) {
    tenantAdminObj.eventDetails().then((elements) => {
      expect(elements.length).to.equal(1);
    });
    tenantAdminObj
      .eventDetails()
      .invoke('text')
      .then((eventDetails) => {
        expect(eventDetails).to.contain('"URL": ' + '"' + url + '"');
        expect(eventDetails).to.contain('"api": ' + '"' + apiVersion + '"');
        expect(eventDetails).to.contain('"service": ' + '"' + serviceName + '"');
        expect(eventDetails).to.contain('"namespace": ' + '"' + namespace + '"');
        expect(eventDetails).to.contain('"name": ' + '"' + username + '"');
      });
  }
);

Then(
  'the user views event details of {string}, {string} of application-notice-published for status-service',
  function (noticeDesc, appName) {
    const regex_notice_description = '"notice": {(.|\n)*"description": "' + noticeDesc + '"';
    const regex_notice_endTimestamp = '"notice": {(.|\n)*"endTimestamp": ".+Z"';
    const regex_notice_startTimestamp = '"notice": {(.|\n)*"startTimestamp": ".+Z"';
    const regex_postedBy_userId = '"postedBy": {(.|\n)*"userId": ".+"';
    const regex_postedBy_userName = '"postedBy": {(.|\n)*"userName": ".+"';
    const regex_application_id = '"application": {(.|\n)*"id": ".+"';
    const regex_application_name = '"application": {(.|\n)*"name": "' + appName + '"';
    const regex_application_description = '"application": {(.|\n)*"description": ".*"';
    tenantAdminObj.eventDetails().then((elements) => {
      expect(elements.length).to.equal(1);
    });
    tenantAdminObj
      .eventDetails()
      .invoke('text')
      .then((eventDetails) => {
        // Verify all required information showing in event details including notice description and application name.
        expect(eventDetails).to.match(new RegExp(regex_notice_description));
        expect(eventDetails).to.match(new RegExp(regex_notice_endTimestamp));
        expect(eventDetails).to.match(new RegExp(regex_notice_startTimestamp));
        expect(eventDetails).to.match(new RegExp(regex_postedBy_userId));
        expect(eventDetails).to.match(new RegExp(regex_postedBy_userName));
        expect(eventDetails).to.match(new RegExp(regex_application_id));
        expect(eventDetails).to.match(new RegExp(regex_application_name));
        expect(eventDetails).to.match(new RegExp(regex_application_description));
      });
  }
);

Then(
  'the user views {string}, {string}, {string} under {string}',
  function (roleName, roleDesc, isInAdminRole, serviceName) {
    let matchCount = 0;
    let isFound = false;
    let tenantOrCore;
    cy.wait(4000); // Wait for the service roles to show up
    // For each row of service roles, check if name, desc, isInAdminRole are matched. If all 3 cells are matched, it's a found
    if (serviceName.includes('urn:ads:platform')) {
      tenantOrCore = 'core';
    } else {
      tenantOrCore = 'tenant';
    }
    tenantAdminObj
      .serviceRoleTableBody(tenantOrCore, serviceName)
      .find('tr')
      .each((row) => {
        cy.wrap(row)
          .find('td')
          .eq(0)
          .invoke('text')
          .then((firstCell) => {
            if (firstCell == roleName) {
              matchCount = matchCount + 1;
            }
          })
          .then(() => {
            cy.wrap(row)
              .find('td')
              .eq(1)
              .invoke('text')
              .then((secondCell) => {
                if (secondCell == roleDesc) {
                  matchCount = matchCount + 1;
                }
              });
          })
          .then(() => {
            cy.wrap(row)
              .find('td')
              .eq(2)
              .invoke('text')
              .then((thirdCell) => {
                if (thirdCell == isInAdminRole) {
                  matchCount = matchCount + 1;
                }
              });
          })
          .then(() => {
            if (matchCount == 3) {
              isFound = true;
            }
          });
      })
      .then(() => {
        expect(isFound).to.equal(
          true,
          'Failed to find service role of ' +
            roleName +
            ', ' +
            roleDesc +
            ', ' +
            isInAdminRole +
            ' under ' +
            serviceName
        );
      });
  }
);

Then(
  'the user views the event details of {string} application status changed from {string} to {string} for subscriber of {string}',
  function (appName, orgStatus, newStatusInput, email) {
    let isFound = false;
    let orgStatusValidationString;
    let newStatusValidationString;

    if (orgStatus != '{original status}') {
      orgStatusValidationString = orgStatus;
    } else {
      cy.task('getOriginalAppStatus').then((appStatus) => {
        orgStatusValidationString = appStatus;
      });
    }
    if (newStatusInput != '{new status}') {
      newStatusValidationString = newStatusInput;
    } else {
      cy.task('getNewAppStatus').then((appStatus) => {
        newStatusValidationString = appStatus;
      });
    }

    tenantAdminObj.eventToggleDetailsIcons().each(($element, $index, $full_array) => {
      //clicking each eye-icon in the list to verify event details
      cy.wrap($element).scrollIntoView();
      cy.wrap($element).shadow().find('button').click({ force: true });
      tenantAdminObj
        .eventDetails()
        .invoke('text')
        .then((eventDetails) => {
          // Check if event log details contains expected info
          if (
            eventDetails.includes('to": "' + email) &&
            eventDetails.includes(appName + ' status changed to') &&
            eventDetails.includes(
              'from <b>' +
                orgStatusValidationString.toLowerCase() +
                '</b> to <b>' +
                newStatusValidationString.toLowerCase() +
                '</b>'
            )
          ) {
            isFound = true;
            cy.wrap($element).click({ force: true });
          } else {
            //clicking eye icon to close event details
            cy.wrap($element).scrollIntoView();
            cy.wrap($element).click({ force: true });
          }
          if (isFound == false && $index + 1 == $full_array.length) {
            expect($index + 1).to.not.eq(
              $full_array.length,
              'No matching email found throughout list of event details'
            );
          }
        });
    });
  }
);

Given('an admin user is on event log page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Event log', 4000);
});

When(
  'the user sends a request to set active revision to {string} for {string} under {string}',
  function (activeVersion, name, namespace) {
    const requestURL =
      Cypress.env('configurationServiceApiUrl') + '/configuration/v2/configuration/' + namespace + '/' + name;
    cy.request({
      method: 'POST',
      url: requestURL,
      auth: {
        bearer: Cypress.env('autotest-admin-token'),
      },
      body: {
        operation: 'SET-ACTIVE-REVISION',
        setActiveRevision: parseInt(activeVersion),
      },
    }).then(function (response) {
      responseObj = response;
    });
  }
);

Then(
  'the user gets a response of active revision for {string} under {string} being {string}',
  function (name, namespace, activeVersion) {
    expect(responseObj.status).to.eq(200);
    expect(responseObj.body).to.have.property('namespace').to.contain(namespace);
    expect(responseObj.body).to.have.property('name').to.contain(name);
    expect(responseObj.body).to.have.property('active').to.equal(parseInt(activeVersion));
  }
);

Then(
  'the user views event details of {string}, {string}, {string}, {string} of active-revision-set for configuration-service',
  function (namespace, name, from, to) {
    tenantAdminObj
      .eventDetails()
      .invoke('text')
      .then((eventDetails) => {
        expect(eventDetails).to.contain('"from": ' + parseInt(from));
        expect(eventDetails).to.contain('"revision": ' + parseInt(to));
        expect(eventDetails).to.contain('"namespace": ' + '"' + namespace + '"');
        expect(eventDetails).to.contain('"name": ' + '"' + name + '"');
      });
  }
);

When('the user changes the resolution to a low resolution not supported by tenant management app', function () {
  // Use resolution of iPhone 12 Pro for testing
  cy.viewport(390, 844);
  cy.wait(2000);
});

Then('the user views a message of Portrait mode is currently not supported', function () {
  tenantAdminObj.portraitModeMessage().should('be.visible');
  // Set the resolution to a supported one
  cy.viewport(1920, 1080);
});

When('the user access tenant management login with the tenant name of {string}', function (tenantName) {
  const urlToTenantLogin = Cypress.config().baseUrl + '/' + tenantName + '/login?kc_idp_hint=';
  cy.visit(urlToTenantLogin);
  cy.wait(2000); // Wait all the redirects to settle down
});

Then('the user can access the log in page with the corresponding tenant id showing in the URL', function () {
  commonObj.usernameEmailField().should('exist');
  commonObj.passwordField().should('exist');
  commonObj.loginButton().should('exist');
  cy.url().should('match', /realms\/[a-zA-Z0-9-]+\//g); // URL contains realms/<tenant id>/
});

Then('the user is redirected to the tenant management landing page', function () {
  welcomPageObj.welcomePageTitle().should('contain.text', 'The Alberta Digital Service Platform (ADSP)');
});
