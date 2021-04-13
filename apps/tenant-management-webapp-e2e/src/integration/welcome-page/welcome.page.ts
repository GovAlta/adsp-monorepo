class WelcomePage {
  signinButton() {
    return cy.get('button:contains("Sign In")');
  }

  createTenantButton() {
    return cy.get('button:contains("Create Tenant")');
  }

  signoutDiv() {
    return cy.contains('Sign Out');
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
