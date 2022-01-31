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

export default { tenantAdminDirectURLLogin };
