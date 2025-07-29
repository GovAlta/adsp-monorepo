import common from './common.page';

const commonObj = new common();

export function tenantAdminDirectURLLogin(url, id, user, password) {
  const urlToTenantLogin = url + '/' + id + '/login?kc_idp_hint=';
  cy.visit(urlToTenantLogin);
  cy.wait(6000); // Wait all the redirects to settle down
  // cy.url().then(function (urlString) {
  //   if (urlString.includes('openid-connect')) {
  //     commonObj.usernameEmailField().type(user);
  //     commonObj.passwordField().type(password);
  //     commonObj.loginButton().click();
  //     cy.wait(8000); // Wait all the redirects to settle down
  //   }
  // });
  // Change to checking if the login controls are present instead of checking URL
  commonObj
    .applicationBody()
    .then((pageBody) => {
      if (
        pageBody.find('input[name="username"]').length > 0 &&
        pageBody.find('input[name="password"]').length > 0 &&
        pageBody.find('input[name="login"]').length > 0
      ) {
        commonObj.usernameEmailField().type(user);
        commonObj.passwordField().type(password);
        commonObj.loginButton().click();
      } else {
        // If the login controls aren't found, we assume we are already logged in
        cy.log('Already logged in, skipping login step.');
      }
    })
    .then(() => {
      cy.wait(8000);
      cy.url().should('include', '/admin');
    });
}

export function tenantAdminMenuItem(menuItem, waitMilliSecs) {
  let menuItemTestid = '';
  switch (menuItem) {
    case 'Dashboard':
      menuItemTestid = 'menu-dashboard';
      break;
    case 'Event log':
      menuItemTestid = 'menu-eventLog';
      break;
    case 'File':
      menuItemTestid = 'menu-file';
      break;
    case 'Cache':
      menuItemTestid = 'menu-cache';
      break;
    case 'Access':
      menuItemTestid = 'menu-access';
      break;
    case 'Status':
      menuItemTestid = 'menu-status';
      break;
    case 'Event':
      menuItemTestid = 'menu-event';
      break;
    case 'Notification':
      menuItemTestid = 'menu-notification';
      break;
    case 'Directory':
      menuItemTestid = 'menu-directory';
      break;
    case 'Configuration':
      menuItemTestid = 'menu-configuration';
      break;
    case 'PDF':
      menuItemTestid = 'menu-pdf';
      break;
    case 'Calendar':
      menuItemTestid = 'menu-calendar';
      break;
    case 'Script':
      menuItemTestid = 'menu-script';
      break;
    case 'Service metrics':
      menuItemTestid = 'menu-service-metrics';
      break;
    case 'Task':
      menuItemTestid = 'menu-task';
      break;
    case 'Form':
      menuItemTestid = 'menu-form';
      break;
    case 'Comment':
      menuItemTestid = 'menu-comment';
      break;
    case 'Feedback':
      menuItemTestid = 'menu-feedback';
      break;
    case 'Value':
      menuItemTestid = 'menu-value';
      break;
    default:
      expect(menuItem).to.be.oneOf([
        'File',
        'Access',
        'Cache',
        'Configuration',
        'Status',
        'Event',
        'Notification',
        'Directory',
        'Dashboard',
        'Event log',
        'PDF',
        'Calendar',
        'Script',
        'Service metrics',
        'Task',
        'Form',
        'Comment',
        'feedback',
        'value',
      ]);
  }
  commonObj.adminMenuItem(menuItemTestid).click();
  cy.wait(waitMilliSecs);
}

export function nowPlusMinusMinutes(nowPlusMinusMinutesString) {
  if (nowPlusMinusMinutesString.match(/Now[+|-][0-9]+mins/g)) {
    const minutes = nowPlusMinusMinutesString.match(/(?<=Now[+|-])[0-9]+(?=mins)/g);
    const plusMinus = nowPlusMinusMinutesString.match(/(?<=Now)[+|-](?=[0-9]+mins)/g);
    const date = new Date();
    if (plusMinus == '+') {
      date.setMinutes(date.getMinutes() + Number(minutes));
    } else if (plusMinus == '-') {
      date.setMinutes(date.getMinutes() - Number(minutes));
    } else {
      assert.fail('Failed to search Criteria string with Now plus or minus a number of minutes.');
    }
    const covertedTimeStamp = date.toISOString();
    return covertedTimeStamp;
  }
}

// Replace the placeholder <$ph> string with the passed-in replacement string
export function stringReplacement(nameString, replacementString) {
  let nameAfterPlacement;
  if (nameString.includes('<$ph>')) {
    // Replace the placeholder string with repacement string
    nameAfterPlacement = nameString.replace('<$ph>', replacementString);
  } else {
    nameAfterPlacement = nameString;
  }
  return nameAfterPlacement;
}

export default { tenantAdminDirectURLLogin, tenantAdminMenuItem, nowPlusMinusMinutes, stringReplacement };
