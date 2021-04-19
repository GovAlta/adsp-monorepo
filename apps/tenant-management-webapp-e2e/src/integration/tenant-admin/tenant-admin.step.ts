/* eslint-disable cypress/no-unnecessary-waiting */
import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import tenantAdminPage from './tenant-admin.page';
import common from '../common/common.page';

const commonObj = new common();
const tenantAdminObj = new tenantAdminPage();
let responseObj: Cypress.Response;

Given('the user goes to tenant management login link', function () {
  const urlToTenantLogin = Cypress.config().baseUrl + '/' + Cypress.env('realm') + '/login';
  cy.visit(urlToTenantLogin);
  commonObj.tenantLoginButton().click();
  cy.wait(2000); // Wait all the redirects to settle down
});

Then('the tenant management admin page is displayed', function () {
  cy.url().should('include', '/tenant-admin');
  tenantAdminObj.dashboardTitle().contains('Tenant Management');
  tenantAdminObj.dashboardServicesMenuCategory();
});

Then('the {string} landing page is displayed', function (type) {
  let urlPart = 'undefined';
  switch (type) {
    case 'administration':
      urlPart = '/admin/tenant-admin/admin';
      break;
    case 'file services':
      urlPart = '/admin/tenant-admin/services/file';
      break;
  }
  cy.url().should('include', urlPart);
});

When('the user selects the {string} menu item', function (menuItem) {
  let menuItemSelector = '';
  switch (menuItem) {
    case 'Administration':
      menuItemSelector = '/admin/tenant-admin/admin';
      break;
    case 'File Services':
      menuItemSelector = '/admin/tenant-admin/services/file';
      break;
    case 'Access':
      menuItemSelector = '/admin/tenant-admin/access';
      break;
  }

  tenantAdminObj.dashboardMenuItem(menuItemSelector).click();
  cy.wait(2000); // wait for the page to load tenant data such as tenant user/role stats
});

When('the user sends a configuration service request to {string}', function (request) {
  const requestURL = Cypress.env('tenantManagementApi') + request;
  cy.request({
    method: 'GET',
    url: requestURL,
    auth: {
      bearer: Cypress.env('core-api-token'),
    },
  }).then(function (response) {
    responseObj = response;
  });
});

Then('the user gets a list of configuration options', function () {
  expect(responseObj.status).to.eq(200);
  expect(responseObj.body.results).to.be.a('array');
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
            roleUserNumApi[response.body[arrayIndex].name] = response2.body.length;
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
