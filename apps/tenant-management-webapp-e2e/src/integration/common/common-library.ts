import common from './common.page';

const commonObj = new common();

export function tenantAdminDirectURLLogin(url, id, user, password) {
  const urlToTenantLogin = url + '/' + id + '/login?kc_idp_hint=';
  cy.visit(urlToTenantLogin);
  cy.wait(5000); // Wait all the redirects to settle down
  cy.url().then(function (urlString) {
    if (urlString.includes('openid-connect')) {
      commonObj.usernameEmailField().type(user);
      commonObj.passwordField().type(password);
      commonObj.loginButton().click();
      cy.wait(10000); // Wait all the redirects to settle down
    }
  });
  cy.url().should('include', '/admin');
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
    default:
      expect(menuItem).to.be.oneOf([
        'File',
        'Access',
        'Configuration',
        'Status',
        'Event',
        'Notification',
        'Directory',
        'Dashboard',
        'Event log',
      ]);
  }
  commonObj.adminMenuItem(menuItemTestid).click();
  cy.wait(waitMilliSecs);
}

export default { tenantAdminDirectURLLogin, tenantAdminMenuItem };
