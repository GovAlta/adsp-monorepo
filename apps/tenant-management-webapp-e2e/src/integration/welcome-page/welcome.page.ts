/// <reference types="cypress-xpath" />
class WelcomePage {
  signinDiv() {
    return cy.xpath('//a[contains(text(), "Sign In")]');
  }

  getStartedButton() {
    return cy.get('a:contains("Get Started")');
  }

  signoutDiv() {
    return cy.xpath('//a[contains(text(), "Sign Out")]');
  }

  userHasOneTenantMessage() {
    return cy.get('.message');
  }

  createTenantTitle() {
    return cy.get('h2:contains("Create tenant")');
  }

  tenantNameField() {
    return cy.get('#name');
  }

  createTenantButton() {
    return cy.get('button:contains("Create Tenant")');
  }

  createTenantLinkButton() {
    return cy.get('a:contains("Create Tenant")');
  }

  newTenantCreationMessage() {
    return cy.get('p:contains("successfully created")');
  }

  tenantLoginButton() {
    return cy.get('button:contains("Tenant Login")');
  }

  userIcon() {
    return cy.get('div > svg');
  }

  realmHeader() {
    return cy.get('#kc-header-wrapper');
  }

  getStartedContinueButton() {
    return cy.get('button:contains("Continue")');
  }

  tenantLoginTenantDisplayName() {
    return cy.xpath('//div[@class="login-pf-page"]/div/div[@id="kc-header-wrapper"]', { timeout: 10000 });
  }
}

export default WelcomePage;
