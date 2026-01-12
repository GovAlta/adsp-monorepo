class valuePage {
  valueOverviewAddDefinitionButton() {
    return cy.xpath('//div[@data-testid="value-service-overview-tab"]//goa-button[text()="Add definition"]');
  }

  valueAddDefinitionModal() {
    return cy.xpath('//goa-modal[@testid="definition-value"]');
  }

  valueAddDefinitionModalHeading() {
    return cy
      .xpath('//goa-modal[@testid="definition-value" and @open="true"]')
      .shadow()
      .find('[data-testid="modal-title"]');
  }

  valueActiveTab() {
    return cy.xpath('//div[contains(@data-testid, "tab-btn") and contains(@class, "active")]');
  }

  valueDefinitionsAddDefinitionButton() {
    return cy.xpath('//div[@data-testid="value-service-definitions-tab"]//goa-button[text()="Add definition"]');
  }

  valueDefinitionsDefinitionModalNamespace() {
    return cy.xpath('//goa-modal[@testid="definition-value" and @open="true"]//goa-input[@testid="value-namespace"]');
  }

  valueDefinitionsDefinitionModalName() {
    return cy.xpath('//goa-modal[@testid="definition-value" and @open="true"]//goa-input[@testid="value-name"]');
  }

  valueDefinitionsDefinitionModalDescription() {
    return cy.xpath(
      '//goa-modal[@testid="definition-value" and @open="true"]//goa-textarea[@testid="value-description"]'
    );
  }

  valueDefinitionsDefinitionModalSchema() {
    return cy.xpath(
      '//goa-modal[@testid="definition-value" and @open="true"]//div[@class="monaco-scrollable-element editor-scrollable vs"]/preceding-sibling::div[@class="native-edit-context"]'
    );
  }

  valueDefinitionsDefinitionModalSaveBtn() {
    return cy.xpath('//goa-modal[@testid="definition-value" and @open="true"]//goa-button[text()="Save"]');
  }

  valueDefinitionsDefinitionModalCancelBtn() {
    return cy.xpath('//goa-modal[@testid="definition-value" and @open="true"]//goa-button[text()="Cancel"]');
  }

  valueDefinitionsDefinition(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="values-definitions-table"]/tbody/tr/td[@data-testid="name" and text()="${name}"]/following-sibling::td[@data-testid="description" and text()="${desc}"]/parent::tr`
    );
  }

  valueDefinitionsDefinitionModalNameFormItem() {
    return cy.xpath('//goa-modal[@testid="definition-value" and @open="true"]//goa-form-item[@label="Name"]');
  }

  valueDefinitionsDefinitionDeleteBtn(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="values-definitions-table"]/tbody/tr/td[@data-testid="name" and text()="${name}"]/following-sibling::td[@data-testid="description" and text()="${desc}"]/following-sibling::td//goa-icon-button[@testid="delete-details"]`
    );
  }

  valueDefinitionsDefinitionEditBtn(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="values-definitions-table"]/tbody/tr/td[@data-testid="name" and text()="${name}"]/following-sibling::td[@data-testid="description" and text()="${desc}"]/following-sibling::td//goa-icon-button[@testid="edit-details"]`
    );
  }

  valueDefinitionsDefinitionEyeBtn(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="values-definitions-table"]/tbody/tr/td[@data-testid="name" and text()="${name}"]/following-sibling::td[@data-testid="description" and text()="${desc}"]/following-sibling::td//goa-icon-button[@testid="toggle-details-visibility"]`
    );
  }

  valueDefinitionsDefinitionDetails(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="values-definitions-table"]/tbody/tr/td[@data-testid="name" and text()="${name}"]/following-sibling::td[@data-testid="description" and text()="${desc}"]/parent::tr/following-sibling::tr//*[@data-testid="value-schema-details"]`
    );
  }

  valueDefinitionsCoreDefinitionNamespace(namespace) {
    return cy.xpath(
      `//h2[text()="Core definitions"]/following-sibling::div//div[@class="group-name" and text()="${namespace}"]`
    );
  }
}

export default valuePage;
