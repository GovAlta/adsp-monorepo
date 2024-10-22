/// <reference types="@cypress/xpath" />
class WelcomePage {
  signinButton() {
    return cy.xpath('//*[@data-testid="sign-ing-btn"]');
  }

  requestATenantButton() {
    return cy.get('a:contains("Request a tenant")');
  }

  signoutDiv() {
    return cy.xpath('//a[contains(text(), "Sign out")]');
  }

  createTenantTitle() {
    return cy.get('h2:contains("Create tenant")');
  }

  tenantNameField() {
    return cy.get('#name');
  }

  createTenantButton() {
    return cy.get('goa-button:contains("Create tenant")');
  }

  createTenantLinkButton() {
    return cy.get('a:contains("Create Tenant")');
  }

  newTenantCreationMessage() {
    return cy.get('p:contains("successfully created")', { timeout: 30000 });
  }

  tenantLoginButton() {
    return cy.get('goa-button:contains("Tenant Login")');
  }

  userIcon() {
    return cy.get('div > svg');
  }

  realmHeader() {
    return cy.get('#kc-header-wrapper');
  }

  getStartedSigninButton() {
    return cy.get('goa-button:contains("Sign in")');
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

  welcomePageTitle() {
    return cy.xpath('//goa-hero-banner//h1');
  }

  createTenantNameFormItem() {
    return cy.xpath('//goa-form-item[@label="Tenant name"]');
  }

  chatAppCard() {
    return cy.xpath(
      '//main//h2[text()="Example apps"]/parent::div/following-sibling::div//h2[text()="Chat app"]/parent::div'
    );
  }

  chatAppCardLearnMoreBtn() {
    return cy.xpath('//goa-button[@data-testid="redirect-button-chat-service"]');
  }
}

export default WelcomePage;
