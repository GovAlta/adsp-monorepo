import React, { useState } from 'react';
import { EventFilterWrapper } from './styled-components';
import { GoAGrid, GoAFormItem, GoAInputDate, GoABadge } from '@abgov/react-components-new';
import { UpdateSearchCriteriaAndFetchEvents } from '@store/calendar/actions';
import { CalendarEventSearchCriteria } from '@store/calendar/models';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { CalendarEventFilterError } from './styled-components';

interface EventListFilterProps {
  calenderName?: string;
}

const isSearchCriteriaValid = (criteria?: CalendarEventSearchCriteria) => {
  return new Date(criteria.startDate) < new Date(criteria.endDate);
};

export const EventListFilter = ({ calenderName }: EventListFilterProps): JSX.Element => {
  const criteria = useSelector((state: RootState) => state.calendarService?.eventSearchCriteria);
  criteria.calendarName = calenderName;
  const dispatch = useDispatch();
  const [showDateError, setShowDateError] = useState<boolean>(false);

  return (
    <EventFilterWrapper>
      <GoAGrid minChildWidth="20ch">
        <GoAFormItem label="Start date">
          <GoAInputDate
            name="calendar-event-filter-start-date"
            value={calenderName ? criteria.startDate : null}
            disabled={calenderName === null}
            onChange={(name, value) => {
              criteria.startDate = new Date(value).toISOString();
              if (!isSearchCriteriaValid(criteria)) {
                setShowDateError(true);
              } else {
                setShowDateError(false);
                dispatch(UpdateSearchCriteriaAndFetchEvents(criteria));
              }
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="End date">
          <GoAInputDate
            name="calendar-event-filter-end-date"
            value={calenderName ? criteria.endDate : null}
            disabled={calenderName === null}
            onChange={(name, value) => {
              criteria.endDate = new Date(value).toISOString();
              if (!isSearchCriteriaValid(criteria)) {
                setShowDateError(true);
              } else {
                setShowDateError(false);
                dispatch(UpdateSearchCriteriaAndFetchEvents(criteria));
              }
            }}
          />
        </GoAFormItem>
      </GoAGrid>
      {showDateError && (
        <>
          <GoABadge type="emergency" icon />
          <CalendarEventFilterError>
            Start after timestamp shall be after the end before timestamp.
          </CalendarEventFilterError>
        </>
      )}
    </EventFilterWrapper>
  );
};
