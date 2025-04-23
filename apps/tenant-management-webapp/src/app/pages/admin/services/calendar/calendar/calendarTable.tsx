import React, { FunctionComponent } from 'react';
import { CalendarItem } from '@store/calendar/models';

import DataTable from '@components/DataTable';
import { TableDiv } from '../styled-components';

import { GoAContextMenuIcon } from '@components/ContextMenu';

interface CalendarItemProps {
  calendar: CalendarItem;
  onEdit?: (calendar: CalendarItem, tenantMode: boolean) => void;
  onDelete?: (calendar: CalendarItem) => void;
  tenantMode: boolean;
}

const CalendarItemComponent: FunctionComponent<CalendarItemProps> = ({
  calendar,
  onDelete,
  onEdit,
  tenantMode,
}: CalendarItemProps) => {
  return (
    <tr key={calendar.name}>
      <td headers="calendar-name">{calendar.displayName}</td>
      <td headers="calendar-id">{calendar.name}</td>

      <td headers="calendar-description">{calendar.description}</td>
      <td headers="calendar-actions">
        <div>
          <GoAContextMenuIcon
            type={tenantMode ? 'create' : 'eye'}
            title={tenantMode ? 'Edit' : 'View'}
            testId={`calendar-edit-${calendar.name}`}
            onClick={() => {
              onEdit(calendar, tenantMode);
            }}
          />

          {tenantMode && (
            <GoAContextMenuIcon
              testId="delete-icon"
              title="Delete"
              type="trash"
              onClick={() => {
                onDelete(calendar);
              }}
            />
          )}
        </div>
      </td>
    </tr>
  );
};

interface calendarTableProps {
  calendars: Record<string, CalendarItem>;
  onEdit?: (calendar: CalendarItem, tenantMode: boolean) => void;
  onDelete?: (calendar: CalendarItem) => void;
  tenantMode?: boolean;
}

export const CalendarTableComponent: FunctionComponent<calendarTableProps> = ({
  calendars,
  onEdit,
  onDelete,
  tenantMode,
}) => {
  return (
    <TableDiv key="calendar">
      <DataTable data-testid="calendar-table">
        <thead data-testid="calendar-table-header">
          <tr>
            <th id="calendar-name" data-testid="calendar-table-header-name">
              Name
            </th>
            <th id="calendar-id" data-testid="calendar-table-header-id">
              Calendar ID
            </th>
            <th id="calendar-description" data-testid="calendar-table-header-description">
              Description
            </th>
            <th id="calendar-actions" data-testid="calendar-table-header-actions">
              Actions
            </th>
          </tr>
        </thead>

        <tbody key="calendar-detail">
          {Object.keys(calendars).map((calendarName) => (
            <CalendarItemComponent
              key={calendarName}
              calendar={calendars[calendarName]}
              onEdit={onEdit}
              onDelete={onDelete}
              tenantMode={tenantMode}
            />
          ))}
        </tbody>
      </DataTable>
      <br />
    </TableDiv>
  );
};
