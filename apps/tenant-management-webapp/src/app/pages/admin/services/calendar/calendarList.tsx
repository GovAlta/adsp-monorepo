import React, { FunctionComponent, useState } from 'react';
import { CalendarItem } from '@store/calendar/models';
import { GoABadge, GoAButton, GoAButtonGroup, GoAModal } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { TableDiv, OverFlowWrapTableCell } from './styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { DeleteCalendar, FetchEventsByCalendar } from '@store/calendar/actions';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { RootState } from '@store/index';
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
    <>
      <tr key={calendar.name}>
        <td headers="calendar-name" data-testid="calendar-name">
          {calendar.displayName}
        </td>
        <td headers="calendar-id" data-testid="calendar-id">
          {calendar.name}
        </td>

        <td headers="calendar-description" data-testid="calendar-description">
          <OverFlowWrapTableCell>{calendar.description}</OverFlowWrapTableCell>
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

        <td headers="calendar-actions" data-testid="calendar-actions">
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
    </>
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

  const onDelete = (calendar) => {
    dispatch(FetchEventsByCalendar(calendar.name));
    setSelectedDeleteCalendar(calendar);
    setTimeout(() => {
      setShowDeleteConfirmation(true);
    }, 600);
    // setShowDeleteConfirmation(true);
    // setTimeout(() => {
    //   if (calendarHasEvents) {
    //     setShowUnableToDeleteConfirmation(true);
    //   } else {
    //     setShowDeleteConfirmation(true);
    //   }
    // }, 1000);
  };

  // const calendarHasEvents = useSelector(
  //   (state: RootState) => state?.calendarService?.calendars[selectedDeleteCalendar?.name]?.selectedCalendarEvents
  // );

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
            <th id="calendar-read-roles" data-testid="calendar-table-header-read-roles">
              Read roles
            </th>
            <th id="calendar-update-roles" data-testid="calendar-table-header-update-roles">
              Update roles
            </th>
            <th id="calendar-actions" data-testid="calendar-table-header-actions">
              Actions
            </th>
          </tr>
        </thead>

        <tbody key="calendar-detail">
          {Object.keys(calendars).map((calendarName) => (
            <CalendarItemComponent calendar={calendars[calendarName]} onEdit={onEdit} onDelete={onDelete} />
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
