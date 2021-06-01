class FileServicePage {
  fileHeaderTag() {
    return cy.xpath('//h2[@class="file-header"]/following-sibling::span');
  }

  enableServiceButton() {
    return cy.get('button:contains("Enable Service")');
  }

  disableServiceButton() {
    return cy.get('button:contains("Disable Service")');
  }

  fileServiceTabs() {
    return cy.xpath('//div[@class="file-header-div"]/following-sibling::div[1]//descendant::div');
  }

  fileServiceTab(text: string) {
    return cy.xpath(
      `//div[@class="file-header-div"]/following-sibling::div[1]//descendant::div[contains(text(), "${text}")]`
    );
  }

  fileTypesAPIsTitle() {
    return cy.xpath('//h2[contains(text(), "File Types APIs")]');
  }

  filesAPIsTitle() {
    return cy.xpath('//h2[contains(text(), "Files APIs")]');
  }
}

export default FileServicePage;
