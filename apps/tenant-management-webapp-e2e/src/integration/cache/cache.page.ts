class CachePage {
  cacheOverviewTab() {
    return cy.xpath('//div[@data-testid="tab-btn-0" and text()="Overview"]');
  }

  cacheOverviewCachetargetsContent(sectionName) {
    return cy.xpath(
      `//*[@data-testid="cache-service-overview-tab-overview"]//h2[text()="${sectionName}"]/following-sibling::p`
    );
  }
}
export default CachePage;
