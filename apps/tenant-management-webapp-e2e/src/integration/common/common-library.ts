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
  let menuItemSelector = '';
  switch (menuItem) {
    case 'Dashboard':
      menuItemSelector = '/admin';
      break;
    case 'Event log':
      menuItemSelector = '/admin/event-log';
      break;
    case 'Files':
      menuItemSelector = '/admin/services/file';
      break;
    case 'Access':
      menuItemSelector = '/admin/access';
      break;
    case 'Status':
      menuItemSelector = '/admin/services/status';
      break;
    case 'Events':
      menuItemSelector = '/admin/services/event';
      break;
    case 'Notifications':
      menuItemSelector = '/admin/services/notifications';
      break;
    case 'Directory':
      menuItemSelector = '/admin/services/directory';
      break;
    default:
      expect(menuItem).to.be.oneOf(['Files', 'Access', 'Status', 'Events', 'Notifications', 'Directory']);
  }
  commonObj.adminMenuItem(menuItemSelector).click();
  cy.wait(waitMilliSecs);
}

export default { tenantAdminDirectURLLogin, tenantAdminMenuItem };
