/// <reference types="cypress-xpath" />
class WelcomePage {
  signinDiv() {
    return cy.xpath('//a[contains(text(), "Sign In")]');
  }

  getStartedButton() {
    return cy.get('a:contains("Get Started")');
  }

  signoutDiv() {
    return cy.xpath('//a[contains(text(), "Sign out")]');
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
    return cy.get('button:contains("Create tenant")');
  }

  createTenantLinkButton() {
    return cy.get('a:contains("Create Tenant")');
  }

  newTenantCreationMessage() {
    return cy.get('p:contains("successfully created")', { timeout: 30000 });
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

  tenantSignInTitle() {
    return cy.get('h1:contains("Sign In")');
  }

  backToSignInPageLinkButton() {
    return cy.get('a:contains("Back to sign in page")');
  }

  tenantCreationFailedH1Title() {
    return cy.xpath('//h1[contains(text(), "Tenant creation failed")]');
  }

  tenantCreationFailedErrorMessage() {
    return cy.xpath('//h1[contains(text(), "Tenant creation failed")]/following-sibling::p');
  }
}

export default WelcomePage;
