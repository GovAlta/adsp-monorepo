import React, { FunctionComponent, useState } from 'react';
import { CalendarItem } from '@store/calendar/models';
import { useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { TableDiv } from '../styled-components';

import { FetchEventsByCalendar } from '@store/calendar/actions';
import { GoAContextMenuIcon } from '@components/ContextMenu';

import { DeleteConfirmationsView } from './deleteConfirmationsView';

interface CalendarItemProps {
  calendar: CalendarItem;
  onEdit?: (calendar: CalendarItem) => void;
  onDelete?: (calendar: CalendarItem) => void;
}

const CalendarItemComponent: FunctionComponent<CalendarItemProps> = ({
  calendar,
  onDelete,
  onEdit,
}: CalendarItemProps) => {
  return (
    <tr key={calendar.name}>
      <td headers="calendar-name">{calendar.displayName}</td>
      <td headers="calendar-id">{calendar.name}</td>

      <td headers="calendar-description">{calendar.description}</td>
      <td headers="calendar-actions">
        {onDelete && (
          <div style={{ display: 'flex' }}>
            <GoAContextMenuIcon
              type="create"
              title="Edit"
              testId={`calendar-edit-${calendar.name}`}
              onClick={() => {
                onEdit(calendar);
              }}
            />

            <GoAContextMenuIcon
              testId="delete-icon"
              title="Delete"
              type="trash"
              onClick={() => {
                onDelete(calendar);
              }}
            />
          </div>
        )}
      </td>
    </tr>
  );
};

interface calendarTableProps {
  calendars: Record<string, CalendarItem>;
  onEdit?: (calendar: CalendarItem) => void;
  onDelete?: (calendar: CalendarItem) => void;
}

export const CalendarTableComponent: FunctionComponent<calendarTableProps> = ({ calendars, onEdit }) => {
  const [selectedDeleteCalendar, setSelectedDeleteCalendar] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const dispatch = useDispatch();

  const onDelete = async (calendar) => {
    await dispatch(FetchEventsByCalendar(calendar.name));
    setSelectedDeleteCalendar(calendar);
    setShowDeleteConfirmation(true);
  };

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
            />
          ))}
        </tbody>
      </DataTable>
      {showDeleteConfirmation && selectedDeleteCalendar && (
        <DeleteConfirmationsView calendarName={selectedDeleteCalendar.name}></DeleteConfirmationsView>
      )}
      <br />
    </TableDiv>
  );
};
