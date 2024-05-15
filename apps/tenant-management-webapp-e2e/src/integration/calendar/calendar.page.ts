class CalendarPage {
  addCalendarOverviewTabBtn() {
    return cy.get('[data-testid="overall-calendar-add-btn"]');
  }

  addCalendarBtn() {
    return cy.get('[data-testid="add-calendar-btn"]');
  }

  addScriptModalTitle() {
    return cy.xpath('//goa-modal[@data-testid="add-calendar-modal" and @open="true"]//*[@slot="heading"]');
  }

  calendarModalCancelButton() {
    return cy.get('[data-testid="calendar-modal-cancel"]');
  }

  calendarModalSaveButton() {
    return cy.get('[data-testid="calendar-modal-save"]');
  }

  calendarTableHeader() {
    return cy.get('[data-testid="calendar-table-header"]');
  }

  addCalendarModalNameField() {
    return cy.xpath(
      '//goa-modal[@data-testid="add-calendar-modal" and @open="true"]//*[@data-testid="calendar-modal-name-input"]'
    );
  }

  addCalendarModalNameFormItem() {
    return cy.xpath('//goa-modal[@data-testid="add-calendar-modal" and @open="true"]//*[@label="Name"]');
  }

  addCalendarModalDescriptionField() {
    return cy.xpath(
      '//goa-modal[@data-testid="add-calendar-modal" and @open="true"]//*[@data-testid="calendar-modal-description-input"]'
    );
  }

  addCalendarModalClientRolesTable(clientName) {
    return cy.xpath(
      `//*[@data-testid="add-calendar-modal" and @open="true"]//h4/div[text()="${clientName}"]/parent::h4/following-sibling::goa-table`
    );
  }

  addCalendarModalRolesTable() {
    return cy.xpath(
      `//*[@data-testid="add-calendar-modal" and @open="true"]//h4/div[text()="autotest"]/parent::h4/following-sibling::goa-table`
    );
  }

  calendarTableBody() {
    return cy.xpath('//table[@data-testid="calendar-table"]//tbody');
  }

  calendarEditButton(rowNumber) {
    return cy.xpath(
      `(//table[@data-testid="calendar-table"]//*[contains(@data-testid, "calendar-edit")])[${rowNumber}]`
    );
  }

  calendarDeleteButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="calendar-table"]//*[contains(@data-testid, "delete-icon")])[${rowNumber}]`);
  }

  editCalendarModal() {
    return cy.xpath('//*[@data-testid="add-calendar-modal" and @open]');
  }

  editCalendarModalDescriptionField() {
    return cy.xpath(
      '//*[@data-testid="add-calendar-modal" and @open]//*[@data-testid="calendar-modal-description-input"]'
    );
  }

  editCalendarModalTable() {
    return cy.xpath('//*[@data-testid="add-calendar-modal"]//goa-table');
  }

  eventsSelectACalendarDropdown() {
    return cy.xpath('//goa-dropdown[@data-testid="calendar-event-dropdown-list"]');
  }

  eventsAddEventButton() {
    return cy.xpath('//goa-button[@type="primary" and text()="Add event"]');
  }

  eventsCalendarEventModalHeading() {
    return cy.xpath('//goa-modal[@open="true"]/div[@slot="heading"]');
  }

  eventsCalendarEventModalNameTextField() {
    return cy.xpath('//goa-form-item[@label="Name"]/goa-input[@data-testid="calendar-event-modal-name-input"]');
  }

  eventsCalendarEventModalNameFormItem() {
    return cy.xpath('//goa-form-item[@label="Name"]');
  }

  eventsCalendarEventModalDescription() {
    return cy.xpath('//goa-textarea[@data-testid="calendar-event-modal-description-input"]');
  }

  eventsCalendarEventModalIsPublicCheckbox() {
    return cy.xpath('//goa-checkbox[@name="isPublicCheckbox"]');
  }

  eventsCalendarEventModalIsAllDayCheckbox() {
    return cy.xpath('//goa-checkbox[@name="isAllDayCheckbox"]');
  }

  eventsCalendarEventModalStartDateField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item[@label="Start Date"]//goa-input');
  }

  eventsCalendarEventModalStartTimeField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item[@label="Start Time"]//goa-input');
  }

  eventsCalendarEventModalEndDateField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item[@label="End Date"]//goa-input');
  }

  eventsCalendarEventModalEndTimeField() {
    return cy.xpath('//goa-modal[@open="true"]//goa-form-item[@label="End time"]//goa-input');
  }

  eventsCalendarEventModalSaveButton() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[text()="Save"]');
  }

  eventsCalendarEventModalCancelButton() {
    return cy.xpath('//goa-modal[@open="true"]//goa-button[text()="Cancel"]');
  }

  eventsTableBody() {
    return cy.xpath('//*[@data-testid="calendar-event-tab"]//tbody');
  }

  eventEditButton(rowNumber) {
    return cy.xpath(
      `//*[@data-testid="calendar-event-tab"]//tbody/tr[${rowNumber}]/td[@headers="calendar-events-actions"]//goa-icon-button[@icon="create"]`
    );
  }

  eventDeleteButton(rowNumber) {
    return cy.xpath(
      `//*[@data-testid="calendar-event-tab"]//tbody/tr[${rowNumber}]/td[@headers="calendar-events-actions"]//goa-icon-button[@icon="trash"]`
    );
  }

  eventsTab() {
    return cy.xpath('//*[@data-testid="calendar-event-tab"]');
  }
}
export default CalendarPage;
