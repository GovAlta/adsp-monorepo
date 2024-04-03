class ConfigurationServicePage {
  namespaceTitle(text) {
    return cy.xpath(`//*[text()="${text}"]`);
  }

  configurationDefinitionWithName(name) {
    return cy.xpath(
      `//*[@data-testid="configuration-table"]//tbody/tr/td/parent::*/following-sibling::tr//*[@data-testid="configuration-name" and contains(text(), "${name}")]`
    );
  }

  configurationDefinition(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/parent::tr`
    );
  }

  configurationDefinitionEditBtn(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/following-sibling::td//goa-icon-button[@data-testid="edit-details"]`
    );
  }

  configurationDefinitionDeleteBtn(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/following-sibling::td//goa-icon-button[@data-testid="delete-config"]`
    );
  }

  configurationDefinitionEyeBtn(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/following-sibling::td//goa-icon-button[@data-testid="configuration-toggle-details-visibility"]`
    );
  }

  configurationDetailsIcon(name) {
    return cy.xpath(
      `//*[@data-testid="configuration-name" and contains(text(), "${name}")]/following-sibling::td//*[@data-testid="configuration-toggle-details-visibility" and @icon="eye"]`
    );
  }

  configurationHideDetailsIcon(name) {
    return cy.xpath(
      `//*[@data-testid="configuration-name" and contains(text(), "${name}")]/following-sibling::td//*[@data-testid="configuration-toggle-details-visibility" and @icon="eye-off"]`
    );
  }

  configurationSchemaDetails(name) {
    return cy.xpath(
      `//*[@data-testid="configuration-name" and contains(text(), "${name}")]/parent::tr/following-sibling::tr//*[@data-testid="configuration-details"]`
    );
  }

  configurationDefinitionDetails(namespace, name, desc) {
    return cy.xpath(
      `//div[text()="${namespace}"]/following-sibling::div//*[@data-testid="configuration-table"]/tbody/tr/td[@data-testid="configuration-name" and text()="${name}"]/following-sibling::td[@data-testid="configuration-description" and text()="${desc}"]/parent::tr/following-sibling::tr//*[@data-testid="configuration-details"]`
    );
  }

  addConfigurationDefinitionBtn() {
    return cy.get('[data-testid="add-definition"]');
  }

  configurationDefinitionModalTitle() {
    return cy.xpath('//*[@data-testid="definition-form" and @open="true"]//*[@slot="heading"]');
  }

  addConfigurationDefinitionModalNamespaceField() {
    return cy.get('[data-testid="form-namespace"]');
  }

  addConfigurationDefinitionModalNameField() {
    return cy.get('[data-testid="form-name"]');
  }

  addConfigurationDefinitionModalDescField() {
    return cy.get('[data-testid="form-description"]');
  }

  addConfigurationDefinitionModalNamespaceFormItem() {
    return cy.xpath('//*[@data-testid="definition-form"]//*[@label="Namespace"]');
  }

  addConfigurationDefinitionModalNameFormItem() {
    return cy.xpath('//*[@data-testid="definition-form"]//*[@label="Name"]');
  }

  configurationDefinitionModalSaveBtn() {
    return cy.xpath('//*[@data-testid="definition-form"]//goa-button[@data-testid="form-save"]');
  }

  configurationDefinitionModalCancelBtn() {
    return cy.xpath('//*[@data-testid="definition-form"]//goa-button[@data-testid="form-cancel"]');
  }

  configurationDefinitionModalPayloadEditor() {
    return cy.xpath('//div[@class="monaco-scrollable-element editor-scrollable vs"]/following-sibling::textarea');
  }

  exportServiceInfoIcon(namespace, name) {
    return cy.xpath(
      `//h3[text()="${namespace}"]/following-sibling::div//goa-checkbox[@text="${name}"]/parent::div/following-sibling::div/div[@class="info-circle-padding"]`
    );
  }

  exportServiceInfoBubble(namespace, name) {
    return cy.xpath(
      `//h3[text()="${namespace}"]/following-sibling::div//goa-checkbox[@text="${name}"]/parent::div/parent::div/following-sibling::div//div[@class="overflow-wrap bubble-border"]`
    );
  }

  selectDefinitionDropdown() {
    return cy.xpath('//goa-dropdown[@data-testid="configuration-select-definition-dropdown"]');
  }

  selectDefinitionDropdownItems() {
    return cy.xpath('//goa-dropdown[@data-testid="configuration-select-definition-dropdown"]/goa-dropdown-item');
  }

  revisionTableWithHeaderTitles() {
    return cy.xpath(
      '//table/thead/tr/th[@id="revision number"]/following-sibling::th[@id="revision date"]/following-sibling::th[@id="action"]/ancestor::table'
    );
  }

  revisionTableLatestBadge() {
    return cy.xpath('//tbody//goa-badge[@content="latest"]');
  }

  revisionTableActiveBadge() {
    return cy.xpath('//tbody//goa-badge[@content="active"]');
  }

  revisionTableAddIconForLatestRevision() {
    return cy.xpath('//tbody/tr[1]/td/div/goa-icon-button[@icon="add"]');
  }

  revisionCreationConfirmationModalHeading() {
    return cy.xpath('//goa-modal[@open="true"]//div[@slot="heading"]');
  }

  revisionCreationConfirmationModalCreateButton() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[@data-testid="revision-create-button"]');
  }

  revisionTableLatestRevisionDate() {
    return cy.xpath('//tbody//goa-badge[@content="latest"]/ancestor::tr/td[2]');
  }

  revisionTableRevisionDetails() {
    return cy.xpath(
      '//tbody//*[@class="number-badge"]/ancestor::tr/following-sibling::tr/td[@class="revision-details"]/div'
    );
  }

  revisionTableEyeIcon(revNumber) {
    return cy.xpath(
      `//tbody//*[@class="number-badge" and text()="${revNumber}"]/ancestor::td/following-sibling::td//goa-icon-button[@icon="eye"]`
    );
  }

  revisionTableEyeOffIcon(revNumber) {
    return cy.xpath(
      `//tbody//*[@class="number-badge" and text()="${revNumber}"]/ancestor::td/following-sibling::td//goa-icon-button[@icon="eye-off"]`
    );
  }

  revisionTablePowerIcon(revNumber) {
    return cy.xpath(
      `//tbody//*[@class="number-badge" and text()="${revNumber}"]/ancestor::td/following-sibling::td//goa-icon-button[@icon="power"]`
    );
  }

  revisionTableLatestRevisionNumber() {
    return cy.xpath(
      '//tbody//*[@class="number-badge"]//goa-badge[@content="latest"]/ancestor::div[@class="number-badge"]'
    );
  }

  revisionTableEditButton() {
    return cy.xpath('//goa-icon-button[@title="Edit"]');
  }

  revisionTableEditRevisionModalTitle() {
    return cy.xpath('//goa-modal[@data-testid="definition-form" and @open="true"]/*[@slot="heading"]');
  }

  revisionTableEditRevisionModalFormItem() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item');
  }

  revisionTableEditRevisionModalSaveButton() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[text()="Save"]');
  }

  revisionTableSetActiveRevisionModalHeading() {
    return cy.xpath('//goa-modal[@open="true"]//*[@slot="heading"]');
  }

  revisionTableSetActiveRevisionModalSetActiveButton() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[text()="Set Active"]');
  }

  revisionTableActiveRevisionNumberBadge() {
    return cy.xpath('//tbody//goa-badge[@content="active"]/ancestor::div[@class="number-badge"]');
  }

  revisionTableLoadMoreButton() {
    return cy.xpath('//*[@data-testid="configuration-revisions-tab"]//goa-button[text()="Load more"]');
  }

  revisionTableRevisionRows() {
    return cy.xpath('//*[@data-testid="configuration-revisions-tab"]//tbody/tr');
  }
}
export default ConfigurationServicePage;
