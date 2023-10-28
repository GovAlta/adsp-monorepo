class CalendarPage {

  addCalendarOverviewTabBtn() {
    return cy.get('[data-testid="overall-calendar-add-btn"]');
  }

  addCalendarBtn() {
    return cy.get('[data-testid="add-calendar-btn"]');
  }

  addScriptModalTitle()
  {
    return cy.xpath('//goa-modal[@data-testid="add-calendar-modal" and @open="true"]//*[@slot="heading"]');
  }

  calendarModalCancelButton()
  {
    return cy.get('[data-testid="calendar-modal-cancel"]');
  }

  calendarModalSaveButton()
  {
    return cy.get('[data-testid="calendar-modal-save"]');
  }

  calendarTableHeader()
  {
    return cy.get('[data-testid="calendar-table-header"]');
  }

  addCalendarModalNameField() {
    return cy.xpath('//goa-modal[@data-testid="add-calendar-modal" and @open="true"]//*[@data-testid="calendar-modal-name-input"]');
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
      `//*[@data-testid="add-calendar-modal" and @open="true"]//h4[text()="autotest"]/following-sibling::goa-table`
    );
  }

  calendarTableBody() {
    return cy.xpath('//table[@data-testid="calendar-table"]//tbody');
  }

  calendarEditButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="calendar-table"]//*[contains(@data-testid, "calendar-edit")])[${rowNumber}]`);
  }

  calendarDeleteButton(rowNumber) {
    return cy.xpath(`(//table[@data-testid="calendar-table"]//*[contains(@data-testid, "delete-icon")])[${rowNumber}]`);
  }

  editCalendarModal() {
    return cy.xpath('//*[@data-testid="add-calendar-modal" and @open]');
  }

  editCalendarModalDescriptionField() {
    return cy.xpath('//*[@data-testid="add-calendar-modal" and @open]//*[@data-testid="calendar-modal-description-input"]');
  }

  editCalendarModalTable() {
    return cy.xpath('//*[@data-testid="add-calendar-modal"]//goa-table');
  }

  calendarEventsPage() {
    return cy.get('[data-testid="calendar-event-tab"]');
  }

  selectEventDropdown() {
    return cy.get('[data-testid="calendar-event-dropdown-list"]');
  }

  selectNoEventText() {
    return cy.get('b');
  }

  eventStartDate() {
    return cy.get('[label="Start date"] > goa-input');
  }

  eventEndDate() {
    return cy.get('[label="End date"] > goa-input');
  }

  addEventBtn() {
    return cy.get('[data-testid="show-calendar-event-table"]');
  }

  addEventModalTitle()
  {
    return cy.get('[data-testid="calendar-event-tab"] > :nth-child(1) > goa-modal > [slot="heading"]')
  }

  addEventModalNameField() {
    return cy.get('[data-testid="calendar-event-modal-name-input"]');
  }

  addEventModalNameFormItem() {
    return cy.get('[label="Name"]');
  }

  editEventModalDescriptionField() {
    return cy.get('[data-testid="calendar-event-modal-description-input"]');
  }

  addEventModalAllDayCheckbox() {
    return cy.get(':nth-child(6) > goa-checkbox');
  }

  addEventModalPublicCheckbox() {
    return cy.get(':nth-child(5) > goa-checkbox');
  }

  addEventModalStartDate() {
  return cy.get('[data-testid="calendar-event-modal-start-date-input"]');
  }

  addEventModalEndDate() {
    return cy.get('[data-testid="calendar-event-modal-end-date-input"]');
  }

  eventTableBody() {
    return cy.xpath('//table[@data-testid="event-table"]//tbody');
  }

  eventTableBodyName(name) {
    return cy.xpath(
      `//*[@data-testid="event-table"]//tbody/tr/td/parent::*/following-sibling::tr//*[@data-testid="event-name" and contains(text(), "${name}")]`      );
  }

  eventNameValue() {
    return cy.get('[data-testid="event-name-th"]');
  }

  eventEditButton() {
    return cy.get('[data-testid="calendar-event-52"]')
  }

  eventDeleteButton() {
    return cy.get('[data-testid="delete-icon"]')
  }

}
export default CalendarPage;