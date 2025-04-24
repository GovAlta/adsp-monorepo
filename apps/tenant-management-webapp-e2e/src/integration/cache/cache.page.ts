class CachePage {
  cacheOverviewTab() {
    return cy.xpath('//div[@data-testid="tab-btn-0" and text()="Overview"]');
  }

  cacheOverviewCachetargetsContent(sectionName) {
    return cy.xpath(
      `//*[@data-testid="cache-service-overview-tab-overview"]//h2[text()="${sectionName}"]/following-sibling::p`
    );
  }

  addCacheTargetOverviewTabBtn() {
    return cy.xpath('//*[@data-testid="cache-service-overview-tab-overview"]//goa-button[text()="Add cache target"]');
  }

  addCacheTargetBtn() {
    return cy.xpath('//*[@data-testid="cache-service-overview-tab-target"]//goa-button[text()="Add cache target"]');
  }

  addTargetModalTitle() {
    return cy.xpath('//goa-modal[@testid="target-cache" and @open="true"]//*[@slot="heading"]');
  }

  targetModalCancelButton() {
    return cy.get('[testid="add-edit-cache-cancel"]');
  }

  targetModalSaveButton() {
    return cy.get('[testid="cache-save"]');
  }

  targetTableHeader() {
    return cy.get('[data-testid="cache-targets-table-header"]');
  }

  targetModalTtlField() {
    return cy.get('[testid="cache-url-id"]');
  }

  targetModalTtlFieldTrailingContent() {
    return cy.xpath('//goa-form-item[@label="TTL"]/goa-input[@testid="cache-url-id"]/div[@slot="trailingContent"]');
  }

  targetModalTargetDropdown() {
    return cy.xpath('//goa-dropdown[@testid="target"]');
  }

  targetModalTargetDropdownItems() {
    return cy.xpath('//goa-dropdown[@testid="target"]/goa-dropdown-item');
  }
}
export default CachePage;
