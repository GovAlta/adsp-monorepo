class CalendarPage {
  addCalendarOverviewTabBtn() {
    return cy.get('[testid="overall-calendar-add-btn"]');
  }

  addCalendarBtn() {
    return cy.get('[testid="add-calendar-btn"]');
  }

  addCalendarModalTitle() {
    return cy.get('goa-modal[testid="add-calendar-modal"][open="true"]').shadow().find('[data-testid="modal-title"]');
  }

  calendarModalCancelButton() {
    return cy.get('[testid="calendar-modal-cancel"]');
  }

  calendarModalSaveButton() {
    return cy.get('[testid="calendar-modal-save"]');
  }

  calendarTableHeader() {
    return cy.get('[data-testid="calendar-table-header"]');
  }

  addCalendarModalNameField() {
    return cy.xpath(
      '//goa-modal[@testid="add-calendar-modal" and @open="true"]//*[@testid="calendar-modal-name-input"]'
    );
  }

  addCalendarModalNameFormItem() {
    return cy.xpath('//goa-modal[@testid="add-calendar-modal" and @open="true"]//*[@label="Name"]');
  }

  addCalendarModalDescriptionField() {
    return cy.xpath(
      '//goa-modal[@testid="add-calendar-modal" and @open="true"]//*[@testid="calendar-modal-description-input"]'
    );
  }

  addCalendarModalClientRolesTable(clientName) {
    return cy.xpath(
      `//*[@testid="add-calendar-modal" and @open="true"]//h4/div[text()="${clientName}"]/parent::h4/following-sibling::goa-table`
    );
  }

  addCalendarModalRolesTable() {
    return cy.xpath(
      `//*[@testid="add-calendar-modal" and @open="true"]//h4/div[text()="autotest"]/parent::h4/following-sibling::goa-table`
    );
  }

  calendarTableBody() {
    return cy.xpath('//table[@data-testid="calendar-table"]//tbody');
  }

  calendarEditButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="calendar-table"]//*[contains(@testid, "calendar-edit")])[${rowNumber}]`);
  }

  calendarDeleteButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="calendar-table"]//*[contains(@testid, "delete-icon")])[${rowNumber}]`);
  }

  editCalendarModal() {
    return cy.xpath('//*[@testid="add-calendar-modal" and @open]');
  }

  editCalendarModalDescriptionField() {
    return cy.xpath('//*[@testid="add-calendar-modal" and @open]//*[@testid="calendar-modal-description-input"]');
  }

  editCalendarModalTable() {
    return cy.xpath('//*[@testid="add-calendar-modal"]//goa-table');
  }

  eventsSelectACalendarDropdown() {
    return cy.xpath('//goa-dropdown[@testid="calendar-event-dropdown-list"]');
  }

  eventsAddEventButton() {
    return cy.xpath('//goa-button[@type="primary" and text()="Add event"]');
  }

  eventsCalendarEventModalHeading() {
    return cy
      .get('goa-modal[testid="add-edit-calendar-event-modal"][open="true"]')
      .shadow()
      .find('[data-testid="modal-title"]');

    // return cy.get('goa-modal[open="true"]').shadow().find('[data-testid="modal-title"]');
  }

  eventsCalendarEventModalNameTextField() {
    return cy.xpath('//goa-form-item[@label="Name"]/goa-input[@testid="calendar-event-modal-name-input"]');
  }

  eventsCalendarEventModalNameFormItem() {
    return cy.xpath('//goa-form-item[@label="Name"]');
  }

  eventsCalendarEventModalDescription() {
    return cy.xpath('//goa-textarea[@testid="calendar-event-modal-description-input"]');
  }

  eventsCalendarEventModalIsPublicCheckbox() {
    return cy.xpath('//goa-checkbox[@name="isPublicCheckbox"]');
  }

  eventsCalendarEventModalIsAllDayCheckbox() {
    return cy.xpath('//goa-checkbox[@name="isAllDayCheckbox"]');
  }

  eventsCalendarEventModalStartDateField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item[@label="Start date"]//goa-input');
  }

  eventsCalendarEventModalStartTimeField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item[@label="Start time"]//goa-input');
  }

  eventsCalendarEventModalEndDateField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item[@label="End date"]//goa-input');
  }

  eventsCalendarEventModalEndDateFormItem() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item[@label="End date"]');
  }

  eventsCalendarEventModalEndTimeField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item[@label="End time"]//goa-input');
  }

  eventsCalendarEventModalSaveButton() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[text()="Save" and not(@disabled)]');
  }

  eventsCalendarEventModalCancelButton() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[text()="Cancel"]');
  }

  eventsTableBody() {
    return cy.xpath('//*[@data-testid="calendar-event-tab"]//tbody');
  }

  eventEditButton(rowNumber) {
    return cy.xpath(
      `//*[@data-testid="calendar-event-tab"]//tbody/tr[${
        rowNumber + 1
      }]/td[@headers="calendar-events-actions"]//goa-icon-button[@icon="create"]`
    );
  }

  eventDeleteButton(rowNumber) {
    return cy.xpath(
      `//*[@data-testid="calendar-event-tab"]//tbody/tr[${
        rowNumber + 1
      }]/td[@headers="calendar-events-actions"]//goa-icon-button[@icon="trash"]`
    );
  }

  eventsTab() {
    return cy.xpath('//*[@data-testid="calendar-event-tab"]');
  }

  coreCalendarsRecord(name, id, description) {
    return cy.xpath(
      `//h2[text()="Core calendars"]/following-sibling::*//table[@data-testid="calendar-table"]//tbody/tr/td[@headers="calendar-name" and text()="${name}"]/following-sibling::td[@headers="calendar-id" and text()="${id}"]/following-sibling::td[@headers="calendar-description" and text()="${description}"]/parent::tr`
    );
  }

  coreCalendarsRecordWithNameOnly(name) {
    return cy.xpath(
      `//h2[text()="Core calendars"]/following-sibling::*//table[@data-testid="calendar-table"]//tbody/tr/td[@headers="calendar-name" and text()="${name}"]/parent::tr`
    );
  }

  coreCalendarsRecordActions() {
    return cy.xpath(
      `//h2[text()="Core calendars"]/following-sibling::*//table[@data-testid="calendar-table"]//tbody/tr/td[@headers="calendar-actions"]`
    );
  }

  coreCalendarsRecordEyeIcon(name, id, description) {
    return cy.xpath(
      `//h2[text()="Core calendars"]/following-sibling::*//table[@data-testid="calendar-table"]//tbody/tr/td[@headers="calendar-name" and text()="${name}"]/following-sibling::td[@headers="calendar-id" and text()="${id}"]/following-sibling::td[@headers="calendar-description" and text()="${description}"]/parent::tr/td[@headers="calendar-actions"]//goa-icon-button[@icon="eye"]`
    );
  }

  coreCalendarsRecordWithNameOnlyEyeIcon(name) {
    return cy.xpath(
      `//h2[text()="Core calendars"]/following-sibling::*//table[@data-testid="calendar-table"]//tbody/tr/td[@headers="calendar-name" and text()="${name}"]/parent::tr/td[@headers="calendar-actions"]//goa-icon-button[@icon="eye"]`
    );
  }

  viewCalendarDetailsModal() {
    return cy.xpath('//goa-modal[@open="true" and @testid="add-calendar-modal"]');
  }

  viewCalendarDetailsModalCloseBtn() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="add-calendar-modal"]//goa-button[@testid="calendar-modal-cancel"]'
    );
  }

  viewCalendarDetailsModalNameField() {
    return cy.xpath(
      '//goa-modal[@open="true" and @testid="add-calendar-modal"]//goa-form-item[@label="Name"]/goa-input'
    );
  }

  viewCalendarDetailsModalRolesTableHeader(name) {
    return cy.xpath(
      `//goa-modal[@open="true" and @testid="add-calendar-modal"]//h4/*[text()="${name}"]/parent::h4/following-sibling::goa-table[1]//thead/tr`
    );
  }

  viewCalendarDetailsModalRoles(name) {
    return cy.xpath(
      `//goa-modal[@open="true" and @testid="add-calendar-modal"]//h4/*[text()="${name}"]/parent::h4/following-sibling::goa-table[1]//tbody/tr`
    );
  }
}
export default CalendarPage;
