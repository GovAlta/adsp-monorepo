import React, { FunctionComponent } from 'react';
import { CalendarItem } from '@store/calendar/models';
import { GoABadge } from '@abgov/react-components/experimental';
import DataTable from '@components/DataTable';
import { TableDiv } from './styled-components';

interface CalendarItemProps {
  calendar: CalendarItem;
  onEdit?: (service: CalendarItem) => void;
  onDelete?: (service: CalendarItem) => void;
}

const CalendarItemComponent: FunctionComponent<CalendarItemProps> = ({ calendar }: CalendarItemProps) => {
  return (
    <>
      <tr key={calendar.name}>
        <td headers="calendar-name" data-testid="calendar-name">
          {calendar.displayName}
        </td>
        <td headers="calendar-id" data-testid="calendar-id">
          {calendar.name}
        </td>
        <td headers="calendar-description" data-testid="calendar-description">
          {calendar.description}
        </td>
        <td headers="calendar-read-roles" data-testid="calendar-read-roles">
          {calendar.readRoles.map((role): JSX.Element => {
            return (
              <div key={`read-roles-${role}`}>
                <GoABadge key={`read-roles-${role}`} type="information" content={role} />
              </div>
            );
          })}
        </td>
        <td headers="calendar-update-roles" data-testid="calendar-update-roles">
          {calendar.updateRoles.map((role): JSX.Element => {
            return (
              <div key={`read-roles-${role}`}>
                <GoABadge key={`read-roles-${role}`} type="information" content={role} />
              </div>
            );
          })}
        </td>
      </tr>
    </>
  );
};

interface calendarTableProps {
  calendars: CalendarItem[];
  onEdit?: (calendar: CalendarItem) => void;
  onDelete?: (calendar: CalendarItem) => void;
}

export const CalendarTableComponent: FunctionComponent<calendarTableProps> = ({ calendars, onEdit, onDelete }) => {
  return (
    <TableDiv key="calendar">
      <DataTable data-testid="calendar-table">
        <thead data-testid="calendar-table-header">
          <tr>
            <th id="calendar-name" data-testid="calendar-table-header-name">
              Name
            </th>
            <th id="calendar-id" data-testid="calendar-table-header-id">
              ID
            </th>
            <th id="calendar-description" data-testid="calendar-table-header-description">
              Description
            </th>
            <th id="calendar-read-roles" data-testid="calendar-table-header-read-roles">
              Read roles
            </th>
            <th id="calendar-update-roles" data-testid="calendar-table-header-update-roles">
              Update roles
            </th>
          </tr>
        </thead>

        <tbody key="calendar-detail">
          {calendars.map((calendar: CalendarItem) => (
            <CalendarItemComponent calendar={calendar} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </DataTable>
      <br />
    </TableDiv>
  );
};
