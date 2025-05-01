class CachePage {
  cacheOverviewTab() {
    return cy.xpath('//div[@data-testid="tab-btn-0" and text()="Overview"]');
  }

  cacheOverviewCachetargetsContent(sectionName) {
    return cy.xpath(`//*[@data-testid="cache-service-overview-tab"]//h2[text()="${sectionName}"]/following-sibling::p`);
  }

  addCacheTargetOverviewTabBtn() {
    return cy.xpath('//*[@data-testid="cache-service-overview-tab"]//goa-button[text()="Add cache target"]');
  }

  addCacheTargetBtn() {
    return cy.xpath('//*[@data-testid="cache-service-targets-tab"]//goa-button[text()="Add cache target"]');
  }

  targetModalTitle() {
    return cy.xpath('//goa-modal[@testid="cache-target-modal" and @open="true"]//*[@slot="heading"]');
  }

  targetModalCancelButton() {
    return cy.get('[testid="add-edit-target-cancel"]');
  }

  targetModalSaveButton() {
    return cy.get('[testid="target-save"]');
  }

  targetTableHeader() {
    return cy.get('[data-testid="cache-targets-table-header"]');
  }

  targetModalTtlField() {
    return cy.get('[testid="target-ttl-seconds"]');
  }

  targetModalTtlFieldTrailingContent() {
    return cy.xpath(
      '//goa-form-item[@label="TTL"]/goa-input[@testid="target-ttl-seconds"]/div[@slot="trailingContent"]'
    );
  }

  targetModalTargetFormItem() {
    return cy.xpath('//goa-form-item[@label="Target"]');
  }

  targetModalTargetDropdown() {
    return cy.xpath('//goa-dropdown[@testid="target"]');
  }

  targetModalTargetDropdownItems() {
    return cy.xpath('//goa-dropdown[@testid="target"]/goa-dropdown-item');
  }

  targetModalUrlField() {
    return cy.xpath('//goa-form-item[@label="Url"]/goa-input[@testid="target-url"]');
  }

  targetsTableBody() {
    return cy.xpath('//table[@data-testid="cache-targets-table"]//tbody');
  }

  targetEditButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="cache-targets-table"]//goa-icon-button[@title="Edit"])[${rowNumber}]`);
  }

  targetDeleteButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="cache-targets-table"]//*[contains(@testid, "delete-target-item")])[${rowNumber}]`
    );
  }
}
export default CachePage;
