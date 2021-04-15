/// <reference types="cypress-xpath" />
class WelcomePage {
  signinDiv() {
    return cy.xpath('//div[contains(text(), "Sign In")]');
  }

  createTenantButton() {
    return cy.get('button:contains("Create Tenant")');
  }

  signoutDiv() {
    return cy.xpath('//div[contains(text(), "Sign Out")]');
  }

  userHasOneTenantMessage() {
    return cy.get('.message');
  }

  createTenantTitle() {
    return cy.get('h1');
  }

  tenantNameField() {
    return cy.get('.signin-input');
  }

  newTenantCreationMessage() {
    return cy.get('p');
  }

  tenantLoginLink() {
    return cy.contains('Click to tenant login');
  }
}

export default WelcomePage;
